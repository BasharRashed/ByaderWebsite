import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isWorkshopPast } from "./workshop-schedule";

const credentials = z.object({
  username: z.string(),
  password: z.string(),
});

type Credentials = z.infer<typeof credentials>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function checkAdmin(creds: Credentials): Promise<boolean> {
  const supabase = await admin();
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  }).rpc("verify_admin_credentials", {
    _username: creds.username,
    _password: creds.password,
  });
  if (error) throw new Error(error.message);
  return data === true;
}

async function assertAdmin(creds: Credentials) {
  if (!(await checkAdmin(creds))) {
    throw new Error("بيانات الدخول غير صحيحة");
  }
}

export type AdminWorkshop = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  description: string;
  day: string;
  time: string;
  duration: string;
  capacity: number;
  host: string;
  image_key: string | null;
  image_url: string;
  sort_order: number;
  completed: boolean;
};

export type BookingStatus = "coming" | "in_progress" | "cancelled";

export type AdminBooking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
  workshop_id: string;
  workshop_title: string;
  status: BookingStatus;
};

function slugify(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "workshop"}-${Math.random().toString(36).slice(2, 7)}`;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.parse(data))
  .handler(async ({ data }) => {
    const ok = await checkAdmin(data);
    return { ok };
  });

export const adminListWorkshops = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.parse(data))
  .handler(async ({ data }): Promise<AdminWorkshop[]> => {
    await assertAdmin(data);
    const supabase = await admin();
    const { data: rows, error } = await supabase
      .from("workshops")
      .select("id, slug, category, title, excerpt, description, day, time, duration, capacity, host, image_key, sort_order, completed")
      .order("sort_order");
    if (error) throw new Error(error.message);

    // Auto-complete workshops whose finish time has already passed.
    const expired = (rows ?? []).filter((row) => !row.completed && isWorkshopPast(row.day, row.duration));
    if (expired.length > 0) {
      await supabase
        .from("workshops")
        .update({ completed: true })
        .in("id", expired.map((row) => row.id));
      for (const row of expired) row.completed = true;
    }

    return Promise.all(
      (rows ?? []).map(async (row) => {
        const imageKey = row.image_key ?? "coffee";
        if (!imageKey.startsWith("uploads/")) {
          return { ...row, image_url: "" } as AdminWorkshop;
        }
        const { data: image } = await supabase.storage
          .from("workshop-images")
          .createSignedUrl(imageKey, 60 * 60);
        return { ...row, image_url: image?.signedUrl ?? "" } as AdminWorkshop;
      }),
    );
  });

const workshopInput = credentials.extend({
  workshop: z.object({
    id: z.string().optional(),
    slug: z.string().trim().optional(),
    title: z.string().trim().min(1),
    category: z.string().trim().min(1),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    duration: z.string().regex(/^\d{2}:\d{2}$/),
    host: z.string().trim().min(1),
    capacity: z.coerce.number().int().min(0),
    excerpt: z.string().trim().min(1),
    description: z.string().trim().min(1),
    image_key: z.string().trim().optional(),
    sort_order: z.coerce.number().int().default(0),
  }),
});

export const adminSaveWorkshop = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => workshopInput.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data);
    if (data.workshop.duration <= data.workshop.time) {
      throw new Error("وقت الانتهاء يجب أن يكون بعد وقت البدء");
    }
    const supabase = await admin();
    const { id, ...fields } = data.workshop;
    let sortOrder = fields.sort_order;
    if (!id) {
      const { data: lastWorkshop } = await supabase
        .from("workshops")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      sortOrder = (lastWorkshop?.sort_order ?? -1) + 1;
    }
    const payload = {
      ...fields,
      sort_order: sortOrder,
      slug: fields.slug && fields.slug.length > 0 ? fields.slug : slugify(fields.title),
      image_key: fields.image_key && fields.image_key.length > 0 ? fields.image_key : "coffee",
    };

    if (id) {
      const { error } = await supabase.from("workshops").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("workshops").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminUploadWorkshopImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("تعذّر قراءة الصورة");
    return data;
  })
  .handler(async ({ data }) => {
    const username = String(data.get("username") ?? "");
    const password = String(data.get("password") ?? "");
    await assertAdmin({ username, password });

    const file = data.get("image");
    if (!(file instanceof File)) throw new Error("اختر صورة للورشة");
    if (!file.type.startsWith("image/")) throw new Error("الملف المختار ليس صورة");
    if (file.size > 5 * 1024 * 1024) throw new Error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `uploads/${crypto.randomUUID()}.${extension}`;
    const supabase = await admin();
    const { error } = await supabase.storage.from("workshop-images").upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return { path };
  });

export const adminDeleteWorkshop = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.extend({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data);
    const supabase = await admin();
    await supabase.from("workshop_bookings").delete().eq("workshop_id", data.id);
    const { error } = await supabase.from("workshops").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListBookings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.parse(data))
  .handler(async ({ data }): Promise<AdminBooking[]> => {
    await assertAdmin(data);
    const supabase = await admin();
    const { data: rows, error } = await supabase
      .from("workshop_bookings")
      .select("id, name, phone, email, created_at, workshop_id, status, workshops(title)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((row: Record<string, unknown>) => ({
      id: row["id"] as string,
      name: row["name"] as string,
      phone: row["phone"] as string,
      email: row["email"] as string,
      created_at: row["created_at"] as string,
      workshop_id: row["workshop_id"] as string,
      status: ((row["status"] as BookingStatus | null) ?? "in_progress"),
      workshop_title:
        ((row["workshops"] as { title?: string } | null)?.title) ?? "—",
    }));
  });

export const adminUpdateBookingStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    credentials
      .extend({
        id: z.string(),
        status: z.enum(["coming", "in_progress", "cancelled"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin(data);
    const supabase = await admin();
    const { error } = await supabase
      .from("workshop_bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    credentials.extend({
      id: z.string().uuid(),
      name: z.string().trim().min(2).max(100),
      phone: z.string().trim().min(7).max(30),
      email: z.string().trim().email().max(255),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin(data);
    const supabase = await admin();
    const email = data.email.toLowerCase();
    const { data: booking, error: lookupError } = await supabase
      .from("workshop_bookings").select("contact_id").eq("id", data.id).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    const contactId = (booking as { contact_id: string | null } | null)?.contact_id;
    if (contactId) {
      const { error: contactError } = await supabase
        .from("contacts").update({ name: data.name, phone: data.phone, email }).eq("id", contactId);
      if (contactError) {
        if (contactError.code === "23505") throw new Error("هذا البريد مستخدم لجهة اتصال أخرى.");
        throw new Error(contactError.message);
      }
      const { error } = await supabase.from("workshop_bookings")
        .update({ name: data.name, phone: data.phone, email }).eq("contact_id", contactId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("workshop_bookings")
        .update({ name: data.name, phone: data.phone, email }).eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export type AdminContact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subscribed: boolean;
  created_at: string;
  workshops: string[];
};

export const adminListContacts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.parse(data))
  .handler(async ({ data }): Promise<AdminContact[]> => {
    await assertAdmin(data);
    const supabase = await admin();
    const { data: rows, error } = await supabase
      .from("contacts")
      .select("id, name, phone, email, subscribed, created_at, workshop_bookings(workshops(title))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((row: Record<string, unknown>) => ({
      id: row["id"] as string,
      name: row["name"] as string,
      phone: row["phone"] as string,
      email: row["email"] as string,
      subscribed: row["subscribed"] as boolean,
      created_at: row["created_at"] as string,
      workshops: ((row["workshop_bookings"] as { workshops: { title?: string } | null }[] | null) ?? [])
        .map((b) => b.workshops?.title ?? "—"),
    }));
  });

export const adminSetContactSubscribed = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    credentials.extend({ id: z.string().uuid(), subscribed: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin(data);
    const supabase = await admin();
    const { error } = await supabase.from("contacts").update({ subscribed: data.subscribed }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.extend({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data);
    const supabase = await admin();
    const { error } = await supabase.from("workshop_bookings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetWorkshopCompleted = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    credentials.extend({ id: z.string().uuid(), completed: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdmin(data);
    const supabase = await admin();
    const { error } = await supabase
      .from("workshops")
      .update({ completed: data.completed })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
