import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown } from "lucide-react";
import heroImage from "@/assets/albaydar-hero.jpg";
import wordmark from "@/assets/albaydar-wordmark-clean.png";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WorkshopCard } from "@/components/workshop-card";
import { CommunityStory } from "@/components/community-story";
import { workshopsQueryOptions } from "@/lib/workshops.functions";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(workshopsQueryOptions()),
  head: () => ({
    meta: [
      { title: "البيدر" },
      { name: "description", content: "اكتشف ورش البيدر ومساحات المجتمع واحجز مكانك من دون إنشاء حساب." },
      { property: "og:title", content: "البيدر — مجتمع يتعلّم معاً" },
      { property: "og:description", content: "ورش حيّة ومساحات تجمع المبدعين والهواة حول المعرفة والحرفة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const topicPositions = [
  "left-[7%] top-[16%]",
  "right-[8%] top-[23%]",
  "bottom-[18%] left-[12%]",
  "bottom-[14%] right-[14%]",
  "left-[18%] top-[38%]",
  "right-[17%] bottom-[36%]",
];

function HomePage() {
  const { data: workshops } = useSuspenseQuery(workshopsQueryOptions());
  const topics = Array.from(new Set(workshops.map((workshop) => workshop.category))).slice(0, 6);
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden">
          <img src={heroImage} alt="لقاء حرفي في مجتمع البيدر" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
          <div className="hero-veil absolute inset-0" />
          {topics.map((topic, index) => (
            <div
              key={topic}
              className={`hero-topic absolute hidden md:block ${index % 2 === 0 ? "float-a" : "float-b"} ${topicPositions[index]}`}
            >
              {topic}
            </div>
          ))}
          <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
            <p className="mb-5 text-sm font-bold text-story-highlight">بيتٌ للمعرفة والحِرفة</p>
            <h1><img src={wordmark} alt="البيدر" className="mx-auto w-64 brightness-0 invert sm:w-96" /></h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-story-muted sm:text-xl">مساحة بتتعلّم فيها، تلتقي، وتعمل أثر — نجلس معاً، نصنع معاً، ونتعلّم من بعضنا.</p>
            <a href="#workshops" className="group mt-9 inline-flex flex-col items-center gap-2 text-lg font-semibold">
              <span>اكتشف ورشنا</span>
              <ArrowDown className="size-5 text-muted-foreground transition-transform group-hover:translate-y-1" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="workshops" className="relative mx-auto max-w-6xl scroll-mt-16 px-5 py-24 sm:px-6 sm:py-32">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-5xl text-primary sm:text-7xl">ورش العمل</h2>
              <p className="mt-2 text-muted-foreground">اختر ورشتك واحجز مقعدك مباشرةً</p>
            </div>
            <Link to="/workshops" className="hidden text-sm font-semibold text-accent hover:underline sm:inline">عرض جميع الورش ←</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop) => <WorkshopCard key={workshop.slug} workshop={workshop} />)}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="glass" size="lg"><Link to="/workshops">عرض جميع الورش</Link></Button>
          </div>
        </section>
        <CommunityStory />
      </main>
      <SiteFooter />
    </div>
  );
}
