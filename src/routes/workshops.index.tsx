import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WorkshopCard } from "@/components/workshop-card";
import { workshopsQueryOptions } from "@/lib/workshops.functions";

export const Route = createFileRoute("/workshops/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(workshopsQueryOptions()),
  head: () => ({ meta: [
    { title: "ورش العمل — البيدر" },
    { name: "description", content: "تصفّح جميع ورش البيدر القادمة واختر اللقاء المناسب لك." },
    { property: "og:title", content: "ورش العمل — البيدر" },
    { property: "og:description", content: "ورش حيّة في القهوة والخط والتصوير داخل مجتمع البيدر." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: WorkshopsPage,
});

function WorkshopsPage() {
  const { data: workshops } = useSuspenseQuery(workshopsQueryOptions());
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-6 sm:pt-28">
        <p className="text-sm font-semibold text-accent">البرنامج القادم</p>
        <h1 className="mt-3 font-display text-6xl text-primary sm:text-8xl">كل ورش البيدر</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">لقاءات صغيرة وعملية يقودها أصحاب حِرف وخبرات من مجتمعنا. اختر ما يثير فضولك.</p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop) => <WorkshopCard key={workshop.slug} workshop={workshop} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
