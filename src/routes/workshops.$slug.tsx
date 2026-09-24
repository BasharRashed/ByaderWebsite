import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock3, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingForm } from "@/components/booking-form";
import { workshopQueryOptions } from "@/lib/workshops.functions";
import { formatWorkshopDate, formatWorkshopTimeRange } from "@/lib/workshop-schedule";

export const Route = createFileRoute("/workshops/$slug")({
  loader: async ({ params, context }) => {
    const workshop = await context.queryClient.ensureQueryData(workshopQueryOptions(params.slug));
    if (!workshop) throw notFound();
    return workshop;
  },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.title} — البيدر` : "الورشة غير موجودة — البيدر" },
    { name: "description", content: loaderData?.excerpt ?? "تفاصيل ورشة من البيدر." },
    { property: "og:title", content: loaderData ? `${loaderData.title} — البيدر` : "ورش البيدر" },
    { property: "og:description", content: loaderData?.excerpt ?? "ورش حيّة من مجتمع البيدر." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: WorkshopDetailPage,
});

function WorkshopDetailPage() {
  const workshop = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-20">
        <Link to="/workshops" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowRight className="size-4" aria-hidden="true" /> العودة إلى الورش
        </Link>
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <article>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">{workshop.category}</span>
            <h1 className="mt-4 font-display text-5xl leading-tight text-primary sm:text-7xl">{workshop.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{workshop.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="detail-pill"><CalendarDays aria-hidden="true" />{formatWorkshopDate(workshop.day)}</span>
              <span className="detail-pill"><Clock3 aria-hidden="true" />{formatWorkshopTimeRange(workshop.time, workshop.duration)}</span>
               <span className="detail-pill"><Users aria-hidden="true" />إجمالي المقاعد: {workshop.capacity}</span>
               <span className={workshop.isCompleted || workshop.isFull ? "detail-pill border-destructive text-destructive" : "detail-pill border-success text-success"}>
                 {workshop.isCompleted ? "ورشة منتهية" : workshop.isFull ? "مكتملة الحجوزات" : `متبقي ${workshop.remaining} مقعد`}
               </span>
            </div>
            <img src={workshop.image} alt={workshop.title} width={1024} height={768} className="mt-8 aspect-[4/3] w-full rounded-md object-cover" />
            <div className="mt-6 border-r-2 border-accent pr-4">
              <p className="text-xs text-muted-foreground">يقدّم الورشة</p>
              <p className="mt-1 font-bold">{workshop.host}</p>
            </div>
          </article>
           <aside className="lg:sticky lg:top-24"><BookingForm slug={workshop.slug} isFull={workshop.isFull} isCompleted={workshop.isCompleted} /></aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
