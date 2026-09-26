import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarIcon, Check, CheckCircle2, ImagePlus, Loader2, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { ar } from "date-fns/locale";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatWorkshopDate, formatWorkshopTimeRange, isValidTimeRange, parseWorkshopDate, toWorkshopDateValue } from "@/lib/workshop-schedule";
import { resolveWorkshopImage } from "@/lib/workshops";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminListWorkshops,
  adminListBookings,
  adminLogin,
  adminSaveWorkshop,
  adminDeleteWorkshop,
  adminUploadWorkshopImage,
  adminSetWorkshopCompleted,
  adminUpdateBookingStatus,
  adminUpdateBooking,
  adminDeleteBooking,
  type AdminBooking,
  type AdminWorkshop,
  type BookingStatus,
} from "@/lib/admin.functions";
import { ContactsSection } from "@/components/admin-contacts";
import { SECTION_LIMIT, SearchBox, ShowAllLink, type AdminView } from "@/components/admin-list-tools";

const ADMIN_VIEWS: AdminView[] = ["workshops", "completed", "bookings", "contacts"];

export const Route = createFileRoute("/admin")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { view?: AdminView } => {
    const view = search["view"];
    return typeof view === "string" && (ADMIN_VIEWS as string[]).includes(view) ? { view: view as AdminView } : {};
  },
  head: () => ({
    meta: [
      { title: "لوحة إدارة البيدر" },
      { name: "description", content: "لوحة داخلية لإدارة ورش البيدر والحجوزات." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "لوحة إدارة البيدر" },
      { property: "og:description", content: "لوحة داخلية لإدارة ورش البيدر والحجوزات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Credentials = { username: string; password: string };

const STORAGE_KEY = "albaydar-admin";

function AdminPage() {
  const [creds, setCreds] = useState<Credentials | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCreds(JSON.parse(saved) as Credentials);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  function handleAuthed(next: Credentials) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCreds(next);
  }

  function handleSignOut() {
    sessionStorage.removeItem(STORAGE_KEY);
    setCreds(null);
  }

  if (!creds) return <LoginScreen onAuthed={handleAuthed} />;
  return <Dashboard creds={creds} onSignOut={handleSignOut} />;
}

function LoginScreen({ onAuthed }: { onAuthed: (creds: Credentials) => void }) {
  const login = useServerFn(adminLogin);
  const mutation = useMutation({
    mutationFn: async (values: Credentials) => {
      const result = await login({ data: values });
      return result.ok;
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    mutation.mutate(values, {
      onSuccess: (ok) => {
        if (ok) onAuthed(values);
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-md border border-border bg-card p-7"
      >
        <h1 className="font-display text-4xl text-primary">لوحة الإدارة</h1>
        <p className="mt-1 text-sm text-muted-foreground">هذه الصفحة مخصّصة لفريق البيدر فقط.</p>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" name="username" required autoComplete="username" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "تسجيل الدخول"}
        </Button>
        {mutation.isError || mutation.data === false ? (
          <p role="alert" className="mt-4 text-sm text-warning">
            بيانات الدخول غير صحيحة، حاول مرة أخرى.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function Dashboard({ creds, onSignOut }: { creds: Credentials; onSignOut: () => void }) {
  const queryClient = useQueryClient();
  const listWorkshops = useServerFn(adminListWorkshops);
  const listBookings = useServerFn(adminListBookings);
  const deleteWorkshop = useServerFn(adminDeleteWorkshop);
  const setWorkshopCompleted = useServerFn(adminSetWorkshopCompleted);
  const updateBookingStatus = useServerFn(adminUpdateBookingStatus);
  const updateBooking = useServerFn(adminUpdateBooking);
  const deleteBooking = useServerFn(adminDeleteBooking);

  const { view } = Route.useSearch();
  const show = (section: AdminView) => !view || view === section;
  const limitOf = (section: AdminView) => (view === section ? undefined : SECTION_LIMIT);

  const [editing, setEditing] = useState<AdminWorkshop | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingDraft, setBookingDraft] = useState({ name: "", phone: "", email: "" });
  const [workshopSearch, setWorkshopSearch] = useState("");
  const [completedSearch, setCompletedSearch] = useState("");

  const workshopsQuery = useQuery({
    queryKey: ["admin", "workshops"],
    queryFn: () => listWorkshops({ data: creds }),
  });
  const bookingsQuery = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: () => listBookings({ data: creds }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteWorkshop({ data: { ...creds, id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (input: { id: string; completed: boolean }) =>
      setWorkshopCompleted({ data: { ...creds, ...input } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: BookingStatus }) =>
      updateBookingStatus({ data: { ...creds, ...input } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });

  const editBookingMutation = useMutation({
    mutationFn: (input: { id: string; name: string; phone: string; email: string }) =>
      updateBooking({ data: { ...creds, ...input } }),
    onSuccess: () => {
      setEditingBookingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => deleteBooking({ data: { ...creds, id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });

  function startEditingBooking(booking: AdminBooking) {
    setEditingBookingId(booking.id);
    setBookingDraft({ name: booking.name, phone: booking.phone, email: booking.email });
  }

  const matches = (title: string, query: string) =>
    title.toLowerCase().includes(query.trim().toLowerCase());
  const allWorkshops = workshopsQuery.data ?? [];
  const activeWorkshops = allWorkshops.filter(
    (workshop) => !workshop.completed && matches(workshop.title, workshopSearch),
  );
  const completedWorkshops = allWorkshops.filter(
    (workshop) => workshop.completed && matches(workshop.title, completedSearch),
  );

  const bookings = bookingsQuery.data ?? [];
  const filteredBookings = useMemo(
    () =>
      bookingFilter === "all"
        ? bookings
        : bookings.filter((booking) => booking.workshop_id === bookingFilter),
    [bookings, bookingFilter],
  );
  const activeBookingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const booking of bookings) {
      if (booking.status !== "cancelled") {
        counts.set(booking.workshop_id, (counts.get(booking.workshop_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [bookings]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <h1 className="font-display text-3xl text-primary">لوحة إدارة البيدر</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              تسجيل الخروج
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                العودة إلى الموقع <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-5 py-12 sm:px-6">
        {view ? (
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin" search={{}}>
              <ArrowRight className="size-4" aria-hidden="true" /> العودة إلى لوحة الإدارة
            </Link>
          </Button>
        ) : null}

        {show("workshops") ? (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-4xl text-primary">إدارة الورش</h2>
            <div className="flex flex-wrap items-center gap-2">
              <SearchBox value={workshopSearch} onChange={setWorkshopSearch} placeholder="ابحث باسم الورشة" />
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" aria-hidden="true" /> ورشة جديدة
              </Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">اليوم والتاريخ</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                  <TableHead className="text-right">مقدّم العرض</TableHead>
                  <TableHead className="text-right">المقاعد المتبقية</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workshopsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      جارٍ التحميل…
                    </TableCell>
                  </TableRow>
                ) : activeWorkshops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      {workshopSearch ? "لا توجد نتائج مطابقة." : "لا توجد ورش قادمة."}
                    </TableCell>
                  </TableRow>
                ) : (
                  activeWorkshops.slice(0, limitOf("workshops")).map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell className="font-medium">{workshop.title}</TableCell>
                      <TableCell>{workshop.category}</TableCell>
                      <TableCell>{formatWorkshopDate(workshop.day)}</TableCell>
                      <TableCell>{formatWorkshopTimeRange(workshop.time, workshop.duration)}</TableCell>
                      <TableCell>{workshop.host}</TableCell>
                      <TableCell>
                        {Math.max(workshop.capacity - (activeBookingCounts.get(workshop.id) ?? 0), 0)} من {workshop.capacity}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(workshop);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" /> تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={completeMutation.isPending}
                            onClick={() => completeMutation.mutate({ id: workshop.id, completed: true })}
                          >
                            <CheckCircle2 className="size-3.5" aria-hidden="true" /> إنهاء
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={removeMutation.isPending}
                            onClick={() => {
                              if (confirm(`حذف ورشة «${workshop.title}» وكل حجوزاتها؟`)) {
                                removeMutation.mutate(workshop.id);
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" /> حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ShowAllLink section="workshops" total={activeWorkshops.length} limit={limitOf("workshops")} />
        </section>
        ) : null}

        {show("completed") ? (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-4xl text-primary">الورش المنتهية</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                تُنقل الورشة تلقائياً إلى هنا بعد انتهاء موعدها، ولا تظهر في الموقع.
              </p>
            </div>
            <SearchBox value={completedSearch} onChange={setCompletedSearch} placeholder="ابحث باسم الورشة" />
          </div>


          <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">اليوم والتاريخ</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                  <TableHead className="text-right">مقدّم العرض</TableHead>
                  <TableHead className="text-right">الحضور المسجّل</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedWorkshops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      {completedSearch ? "لا توجد نتائج مطابقة." : "لا توجد ورش منتهية بعد."}
                    </TableCell>
                  </TableRow>
                ) : (
                  completedWorkshops.slice(0, limitOf("completed")).map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell className="font-medium">{workshop.title}</TableCell>
                      <TableCell>{workshop.category}</TableCell>
                      <TableCell>{formatWorkshopDate(workshop.day)}</TableCell>
                      <TableCell>{formatWorkshopTimeRange(workshop.time, workshop.duration)}</TableCell>
                      <TableCell>{workshop.host}</TableCell>
                      <TableCell>
                        {activeBookingCounts.get(workshop.id) ?? 0} من {workshop.capacity}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={completeMutation.isPending}
                            onClick={() => completeMutation.mutate({ id: workshop.id, completed: false })}
                          >
                            <RotateCcw className="size-3.5" aria-hidden="true" /> إعادة تفعيل
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={removeMutation.isPending}
                            onClick={() => {
                              if (confirm(`حذف ورشة «${workshop.title}» وكل حجوزاتها؟`)) {
                                removeMutation.mutate(workshop.id);
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" /> حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ShowAllLink section="completed" total={completedWorkshops.length} limit={limitOf("completed")} />
        </section>
        ) : null}

        {show("bookings") ? (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-4xl text-primary">الحجوزات</h2>
            <select
              value={bookingFilter}
              onChange={(event) => setBookingFilter(event.target.value)}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              aria-label="تصفية حسب الورشة"
            >
              <option value="all">كل الورش</option>
              {(workshopsQuery.data ?? []).map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">البريد</TableHead>
                  <TableHead className="text-right">الورشة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      جارٍ التحميل…
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      لا توجد حجوزات.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.slice(0, limitOf("bookings")).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {editingBookingId === booking.id ? (
                          <Input
                            aria-label={`اسم صاحب حجز ${booking.workshop_title}`}
                            value={bookingDraft.name}
                            maxLength={100}
                            onChange={(event) => setBookingDraft((draft) => ({ ...draft, name: event.target.value }))}
                            className="min-w-36"
                          />
                        ) : booking.name}
                      </TableCell>
                      <TableCell dir="ltr" className="text-right">
                        {editingBookingId === booking.id ? (
                          <Input
                            aria-label={`هاتف ${booking.name}`}
                            type="tel"
                            value={bookingDraft.phone}
                            minLength={7}
                            maxLength={30}
                            onChange={(event) => setBookingDraft((draft) => ({ ...draft, phone: event.target.value }))}
                            className="min-w-36"
                          />
                        ) : booking.phone}
                      </TableCell>
                      <TableCell dir="ltr" className="text-right">
                        {editingBookingId === booking.id ? (
                          <Input
                            aria-label={`بريد ${booking.name}`}
                            type="email"
                            value={bookingDraft.email}
                            maxLength={255}
                            onChange={(event) => setBookingDraft((draft) => ({ ...draft, email: event.target.value }))}
                            className="min-w-52"
                          />
                        ) : booking.email}
                      </TableCell>
                      <TableCell>{booking.workshop_title}</TableCell>
                      <TableCell>
                        <select
                          value={booking.status}
                          aria-label={`حالة ${booking.name}`}
                          disabled={statusMutation.isPending}
                          onChange={(event) =>
                            statusMutation.mutate({
                              id: booking.id,
                              status: event.target.value as BookingStatus,
                            })
                          }
                          className={cn(
                            "h-9 rounded-md border px-2 text-sm",
                            "font-semibold",
                            booking.status === "coming" && "border-success bg-success/10 text-success",
                            booking.status === "cancelled" && "border-destructive bg-destructive/10 text-destructive",
                            booking.status === "in_progress" && "border-border bg-card text-foreground",
                          )}
                        >
                          <option value="in_progress" className="bg-popover text-popover-foreground">قيد المتابعة</option>
                          <option value="coming" className="bg-popover text-success">قادم</option>
                          <option value="cancelled" className="bg-popover text-destructive">ملغى</option>
                        </select>
                        {statusMutation.isError ? <p className="mt-1 text-xs text-destructive">تعذّر تغيير الحالة.</p> : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editingBookingId === booking.id ? (
                            <>
                              <Button
                                size="icon"
                                aria-label={`حفظ تعديلات ${booking.name}`}
                                disabled={editBookingMutation.isPending || bookingDraft.name.trim().length < 2 || bookingDraft.phone.trim().length < 7 || !bookingDraft.email.includes("@")}
                                onClick={() => editBookingMutation.mutate({ id: booking.id, ...bookingDraft })}
                              >
                                {editBookingMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" aria-label="إلغاء التعديل" onClick={() => setEditingBookingId(null)}>
                                <X className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="icon" aria-label={`تعديل حجز ${booking.name}`} onClick={() => startEditingBooking(booking)}>
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            aria-label={`حذف حجز ${booking.name}`}
                            disabled={deleteBookingMutation.isPending || editingBookingId === booking.id}
                            onClick={() => {
                              if (confirm(`حذف حجز «${booking.name}» من ورشة «${booking.workshop_title}»؟`)) {
                                deleteBookingMutation.mutate(booking.id);
                              }
                            }}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ShowAllLink section="bookings" total={filteredBookings.length} limit={limitOf("bookings")} />
        </section>
        ) : null}

        {show("contacts") ? <ContactsSection creds={creds} limit={limitOf("contacts")} /> : null}
      </main>

      <WorkshopDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        workshop={editing}
        creds={creds}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}

function WorkshopDialog({
  open,
  workshop,
  creds,
  onClose,
}: {
  open: boolean;
  workshop: AdminWorkshop | null;
  creds: Credentials;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(adminSaveWorkshop);
  const uploadImage = useServerFn(adminUploadWorkshopImage);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => parseWorkshopDate(workshop?.day));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(
    workshop?.image_url || (workshop?.image_key ? resolveWorkshopImage(workshop.image_key) : ""),
  );
  const [scheduleError, setScheduleError] = useState("");
  const mutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.set("username", creds.username);
        uploadData.set("password", creds.password);
        uploadData.set("image", imageFile);
        const uploaded = await uploadImage({ data: uploadData });
        values["image_key"] = uploaded.path;
      }
      return save({ data: { ...creds, workshop: values } as never });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      onClose();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startTime = String(form.get("time") ?? "");
    const finishTime = String(form.get("duration") ?? "");
    if (!selectedDate) {
      setScheduleError("اختر يوم وتاريخ الورشة.");
      return;
    }
    if (!isValidTimeRange(startTime, finishTime)) {
      setScheduleError("وقت الانتهاء يجب أن يكون بعد وقت البدء.");
      return;
    }
    setScheduleError("");
    const values: Record<string, unknown> = {
      title: String(form.get("title") ?? ""),
      category: String(form.get("category") ?? ""),
      day: toWorkshopDateValue(selectedDate),
      time: startTime,
      duration: finishTime,
      host: String(form.get("host") ?? ""),
      capacity: Number(form.get("capacity") ?? 0),
      excerpt: String(form.get("excerpt") ?? ""),
      description: String(form.get("description") ?? ""),
      image_key: workshop?.image_key ?? "coffee",
      sort_order: workshop?.sort_order ?? 0,
      slug: String(form.get("slug") ?? ""),
    };
    if (workshop) values["id"] = workshop.id;
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-primary">
            {workshop ? "تعديل الورشة" : "ورشة جديدة"}
            <span className="mt-1 block font-sans text-sm font-normal text-muted-foreground">صورة الورشة: 1600 × 1200 بكسل (4:3)، بحد أقصى 5 ميجابايت</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="title" label="العنوان" defaultValue={workshop?.title} required />
            <Field name="category" label="التصنيف" defaultValue={workshop?.category} required />
            <div className="space-y-2">
              <Label>اليوم والتاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className={cn("w-full justify-start text-right font-normal", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="size-4" aria-hidden="true" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ar} initialFocus className="pointer-events-auto p-3" />
                </PopoverContent>
              </Popover>
            </div>
            <Field name="time" label="وقت البدء" type="time" defaultValue={workshop?.time} required />
            <Field name="duration" label="وقت الانتهاء" type="time" defaultValue={workshop?.duration} required />
            <Field name="host" label="مقدّم العرض" defaultValue={workshop?.host} required />
            <Field
              name="capacity"
              label="عدد المقاعد"
              type="number"
              defaultValue={String(workshop?.capacity ?? 12)}
              required
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="workshop-image">صورة الورشة</Label>
              <label htmlFor="workshop-image" className="flex min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40 transition-colors hover:border-accent">
                {imagePreview ? (
                  <img src={imagePreview} alt="معاينة صورة الورشة" className="aspect-[4/3] max-h-56 w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><ImagePlus className="size-6" aria-hidden="true" />اختر صورة</span>
                )}
              </label>
              <Input
                id="workshop-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    setScheduleError("حجم الصورة يجب ألا يتجاوز 5 ميجابايت.");
                    event.currentTarget.value = "";
                    return;
                  }
                  setImageFile(file);
                  if (file) {
                    setScheduleError("");
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
            <Field
              name="slug"
              label="الرابط المختصر (يُولّد تلقائياً إن تُرك فارغاً)"
              defaultValue={workshop?.slug}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">وصف مختصر</Label>
            <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={workshop?.excerpt} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">الوصف الكامل</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={workshop?.description}
              required
            />
          </div>
          {scheduleError ? <p role="alert" className="text-sm text-warning">{scheduleError}</p> : null}
          {mutation.isError ? (
            <p role="alert" className="text-sm text-warning">
              تعذّر الحفظ، تأكد من تعبئة كل الحقول وحاول مجدداً.
            </p>
          ) : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | undefined;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />
    </div>
  );
}
