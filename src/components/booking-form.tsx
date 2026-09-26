import { useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createBooking } from "@/lib/workshops.functions";

function ResultMark({ success }: { success: boolean }) {
  return (
    <svg viewBox="0 0 52 52" className={success ? "result-mark text-success" : "result-mark text-destructive"} aria-hidden="true">
      <circle className="result-mark-circle" cx="26" cy="26" r="24" fill="none" />
      {success ? (
        <path className="result-mark-path" fill="none" d="M15 27l7 7 15-16" />
      ) : (
        <>
          <path className="result-mark-path" fill="none" d="M18 18l16 16" />
          <path className="result-mark-path result-mark-delay" fill="none" d="M34 18L18 34" />
        </>
      )}
    </svg>
  );
}

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
  const formRef = useRef<HTMLFormElement>(null);
  const [subscribe, setSubscribe] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (values: { name: string; phone: string; email: string; subscribe: boolean }) =>
      submitBooking({ data: { slug, ...values } }),
    onSuccess: (result) => {
      if (!result.ok) return;
      formRef.current?.reset();
      setSubscribe(false);
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
    onSettled: () => setResultOpen(true),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    mutation.mutate({
      name: String(values.get("name") ?? ""),
      phone: String(values.get("phone") ?? ""),
      email: String(values.get("email") ?? ""),
      subscribe,
    });
  }

 const failed = mutation.isError || mutation.data?.ok === false;
  const errorMessage = mutation.data?.message ?? "ما قدرناش نرسل الحجز، جرّب مرة ثانية أو تواصل معنا مباشرة.";

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="rounded-md border border-border bg-card p-6 sm:p-7">
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
          <div className="flex items-start gap-3">
            <Checkbox id="subscribe" checked={subscribe} disabled={isFull} onCheckedChange={(value) => setSubscribe(value === true)} className="mt-0.5" />
            <Label htmlFor="subscribe" className="text-sm font-normal leading-relaxed text-muted-foreground">
              أرغب باستلام آخر الأخبار والورش الجديدة عبر الهاتف أو البريد الإلكتروني
            </Label>
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
      </form>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-sm text-center" dir="rtl">
          <div key={String(mutation.submittedAt)} className="flex flex-col items-center gap-4 py-4">
            <ResultMark success={!failed} />
            <DialogTitle className="font-display text-3xl text-primary">
              {failed ? "لم يكتمل الحجز" : "تم الحجز بنجاح!"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {failed ? errorMessage : "استلمنا حجزك، ورح نتواصل معك على الهاتف أو البريد لتأكيد مقعدك."}
            </DialogDescription>
            <Button variant={failed ? "outline" : "luminous"} className="mt-2 w-full" onClick={() => setResultOpen(false)}>
              {failed ? "حاول مرة أخرى" : "تمام"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
