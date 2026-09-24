import { type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking } from "@/lib/workshops.functions";

export function BookingForm({
  slug,
  isFull: seatsFull,
  isCompleted = false,
}: {
  slug: string;
  isFull: boolean;
  isCompleted?: boolean;
}) {
  const isFull = seatsFull || isCompleted;
  const submitBooking = useServerFn(createBooking);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: { name: string; phone: string; email: string }) =>
      submitBooking({ data: { slug, ...values } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workshops"] }),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    mutation.mutate({
      name: String(values.get("name") ?? ""),
      phone: String(values.get("phone") ?? ""),
      email: String(values.get("email") ?? ""),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border bg-card p-6 sm:p-7">
      <h2 className="font-display text-4xl text-primary">{isCompleted ? "انتهت الورشة" : isFull ? "اكتمل الحجز" : "احجز مقعدك"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{isCompleted ? "هذه الورشة أُقيمت بالفعل." : isFull ? "لا توجد مقاعد متبقية حالياً." : "لا حاجة لإنشاء حساب — عرّفنا بنفسك فقط"}</p>
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">الاسم الكامل</Label>
          <Input id="name" name="name" required maxLength={100} disabled={isFull} autoComplete="name" placeholder="مثال: ليلى الحسن" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" name="phone" type="tel" required minLength={7} maxLength={30} disabled={isFull} autoComplete="tel" dir="ltr" placeholder="05xxxxxxxx" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" name="email" type="email" required maxLength={255} disabled={isFull} autoComplete="email" dir="ltr" placeholder="you@example.com" />
        </div>
      </div>
      <Button type="submit" variant="luminous" size="lg" className="mt-6 w-full" disabled={mutation.isPending || isFull}>
        {mutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> جارٍ إرسال الحجز…
          </>
        ) : (
          "تأكيد الحجز"
        )}
      </Button>
      {mutation.isSuccess ? (
        <p role="status" className="mt-4 flex items-start gap-2 text-sm text-accent">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          تم استلام حجزك! رح نتواصل معك على الهاتف أو البريد لتأكيد مقعدك.
        </p>
      ) : null}
      {mutation.isError ? (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-warning">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ما قدرناش نرسل الحجز، جرّب مرة ثانية أو تواصل معنا مباشرة.
        </p>
      ) : null}
    </form>
  );
}
