import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { resolveWorkshopImage, type Workshop } from "./workshops";
import { isWorkshopPast } from "./workshop-schedule";

type WorkshopRow = {
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
  image_key: string;
  completed: boolean;
};

type Availability = { reserved: number; remaining: number; isFull: boolean };

function publicClient() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

async function resolveStoredImage(supabase: ReturnType<typeof publicClient>, imageKey: string) {
  if (!imageKey.startsWith("uploads/")) return resolveWorkshopImage(imageKey);
  const { data, error } = await supabase.storage.from("workshop-images").createSignedUrl(imageKey, 60 * 60);
  return error ? resolveWorkshopImage("coffee") : data.signedUrl;
}

async function mapRow(
  supabase: ReturnType<typeof publicClient>,
  row: WorkshopRow,
  availability: Availability,
): Promise<Workshop> {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    description: row.description,
    day: row.day,
    time: row.time,
    duration: row.duration,
    capacity: row.capacity,
    ...availability,
    isCompleted: row.completed || isWorkshopPast(row.day, row.duration),
    host: row.host,
    image: await resolveStoredImage(supabase, row.image_key ?? "coffee"),
  };
}

const workshopColumns = "id, slug, category, title, excerpt, description, day, time, duration, capacity, host, image_key, completed";

async function getAvailability(rows: WorkshopRow[]) {
  const ids = rows.map((row) => row.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("workshop_bookings")
      .select("workshop_id")
      .in("workshop_id", ids)
      .neq("status", "cancelled");
    if (error) throw new Error(error.message);
    for (const booking of data ?? []) {
      counts.set(booking.workshop_id, (counts.get(booking.workshop_id) ?? 0) + 1);
    }
  }
  return new Map(rows.map((row) => {
    const reserved = counts.get(row.id) ?? 0;
    const remaining = Math.max(row.capacity - reserved, 0);
    return [row.id, { reserved, remaining, isFull: remaining === 0 } satisfies Availability];
  }));
}

export const getWorkshops = createServerFn({ method: "GET" }).handler(
  async (): Promise<Workshop[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("workshops")
      .select(workshopColumns)
      .order("sort_order");
    if (error) throw new Error(error.message);
    const rows = ((data ?? []) as WorkshopRow[]).filter(
      (row) => !row.completed && !isWorkshopPast(row.day, row.duration),
    );
    const availability = await getAvailability(rows);
    return Promise.all(rows.map((row) => mapRow(
      supabase,
      row,
      availability.get(row.id) ?? { reserved: 0, remaining: row.capacity, isFull: row.capacity === 0 },
    )));
  },
);

export const workshopsQueryOptions = () =>
  queryOptions({
    queryKey: ["workshops"],
    queryFn: getWorkshops,
    staleTime: 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

export const getWorkshop = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: slug }): Promise<Workshop | null> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("workshops")
      .select(workshopColumns)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as WorkshopRow;
    const availability = await getAvailability([row]);
    return mapRow(
      supabase,
      row,
      availability.get(row.id) ?? { reserved: 0, remaining: row.capacity, isFull: row.capacity === 0 },
    );
  });

export const workshopQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["workshops", slug],
    queryFn: () => getWorkshop({ data: slug }),
    staleTime: 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

const bookingSchema = z.object({
  slug: z.string(),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(255),
  subscribe: z.boolean().default(false),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    try {
      return await submitBooking(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      return { ok: false, message: /[\u0600-\u06FF]/.test(message) ? message : "تعذّر إرسال الحجز، حاول مرة أخرى." };
    }
  });

async function submitBooking(data: z.infer<typeof bookingSchema>) {
    const supabase = publicClient();
    const { data: workshop, error: lookupError } = await supabase
      .from("workshops")
      .select("id, completed, day, duration")
      .eq("slug", data.slug)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (!workshop) throw new Error("لم يتم العثور على الورشة المطلوبة.");
    const details = workshop as { id: string; completed: boolean; day: string; duration: string };
    if (details.completed || isWorkshopPast(details.day, details.duration)) {
      throw new Error("انتهت هذه الورشة ولم يعد الحجز متاحاً.");
    }

    // Contacts are server-only; one contact per email.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: existing, error: contactLookupError } = await supabaseAdmin
      .from("contacts").select("id, subscribed").eq("email", email).maybeSingle();
    if (contactLookupError) throw new Error(contactLookupError.message);
    const current = existing as { id: string; subscribed: boolean } | null;
    let contactId: string;
    if (current) {
      const { error: updateError } = await supabaseAdmin.from("contacts")
        .update({ name: data.name, phone: data.phone, subscribed: current.subscribed || data.subscribe })
        .eq("id", current.id);
      if (updateError) throw new Error(updateError.message);
      contactId = current.id;
      const { data: dup, error: dupError } = await supabaseAdmin.from("workshop_bookings")
        .select("id").eq("contact_id", contactId).eq("workshop_id", details.id)
        .neq("status", "cancelled").limit(1);
      if (dupError) throw new Error(dupError.message);
      if ((dup ?? []).length > 0) throw new Error("أنت مسجّل مسبقاً في هذه الورشة بنفس البريد الإلكتروني.");
    } else {
      const { data: created, error: createError } = await supabaseAdmin.from("contacts")
        .insert({ email, name: data.name, phone: data.phone, subscribed: data.subscribe })
        .select("id").single();
      if (createError) throw new Error(createError.message);
      contactId = (created as { id: string }).id;
    }

    const { error } = await supabaseAdmin.from("workshop_bookings").insert({
      workshop_id: details.id,
      contact_id: contactId,
      name: data.name,
      phone: data.phone,
      email,
    } as never);
    if (error) {
      if (error.message.includes("fully booked")) throw new Error("اكتمل عدد المقاعد في هذه الورشة.");
      throw new Error("تعذّر إرسال الحجز، حاول مرة أخرى.");
    }
    return { ok: true };
}
