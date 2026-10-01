import { useRef, useState } from "react";
import { ArrowUpLeft, Lightbulb, MapPin, Play, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import aboutVideo from "@/assets/albaydar-about.mp4";
import aboutVideoWebm from "@/assets/albaydar-about.webm";
import aboutPoster from "@/assets/albaydar-about-poster.jpg";
import communityImage from "@/assets/about-community.jpg";
import guidanceImage from "@/assets/about-guidance.jpg";
import craftImage from "@/assets/about-craft.jpg";
import buildingImage from "@/assets/about-building.webp";

const offerings = [
  "ورش عمل وتدريب",
  "جلسات إرشاد وتوجيه",
  "مساحات عمل مشتركة",
  "دعم مشاريع شبابية",
  "فعاليات مجتمعية",
];

export function AboutStory() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(true);
    void video.play();
  };

  return (
    <section id="about" aria-labelledby="about-title" className="relative scroll-mt-16 overflow-hidden bg-background pt-24 sm:pt-32">
      <div className="pointer-events-none absolute right-0 top-0 -translate-y-16 translate-x-1/4 select-none font-main text-[12rem] leading-none text-muted/55 sm:text-[20rem]" aria-hidden="true">البيدر</div>
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-start lg:gap-14">
          <div className="order-2 lg:order-1 lg:col-span-7 lg:pt-14">
            <p className="inline-flex border border-brand-yellow/60 px-4 py-1 font-secondary text-sm font-bold text-accent">عن البيدر</p>
            <h2 id="about-title" className="mt-5 font-main text-6xl leading-none text-primary sm:text-8xl">بداية <span className="text-accent">الحكاية</span></h2>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-foreground sm:text-2xl sm:leading-10">
              مساحة مجتمعية إبداعية ترافق الشباب والشابات من الفكرة إلى الفعل، ومن العزلة إلى الانتماء.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg sm:leading-9">
              في البيدر تلتقي المعرفة بالتجربة والاحتواء. نفتح مساحة آمنة لاكتشاف الذات وبناء المهارات، ليجد كل شاب وشابة المربّي والمرشد والمجتمع الذي يساعدهم على صناعة أثر حقيقي ومستدام.
            </p>

            <div className="mt-12 border-t border-border pt-9">
              <div className="mb-7 flex items-center gap-3">
                <Sparkles className="size-5 text-accent" aria-hidden="true" />
                <h3 className="font-secondary text-2xl font-bold text-primary sm:text-3xl">ماذا نقدّم؟</h3>
              </div>
              <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2" aria-label="خدمات البيدر">
                {offerings.map((offering, index) => (
                  <li key={offering} className="group flex items-center gap-4 border-b border-border pb-4">
                    <span className="grid size-10 shrink-0 place-items-center bg-muted font-main text-2xl text-accent transition-colors duration-300 group-hover:bg-brand-yellow group-hover:text-secondary-foreground" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base text-foreground sm:text-lg">{offering}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Mount+of+Olives+Jerusalem"
              target="_blank"
              rel="noreferrer"
              className="group mt-10 inline-flex items-center gap-3 text-muted-foreground transition-colors hover:text-accent"
              aria-label="فتح موقع البيدر في القدس على خرائط Google"
            >
              <MapPin className="size-5 text-accent" aria-hidden="true" />
              <span>
                <strong className="block font-secondary text-sm text-foreground">القدس — جبل الزيتون</strong>
                <span className="text-sm">مكان يلتقي فيه عبق التاريخ بوضوح الفكرة</span>
              </span>
              <ArrowUpLeft className="size-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
            </a>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <div className="mx-auto w-full max-w-sm">
              <div className="relative aspect-[9/16] overflow-hidden rounded-md bg-brand-dark shadow-2xl ring-8 ring-card/70">
                <video
                  ref={videoRef}
                  poster={aboutPoster}
                  preload="metadata"
                  playsInline
                  controls={isPlaying}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="absolute inset-0 h-full w-full object-contain"
                >
                  <source src={aboutVideoWebm} type="video/webm" />
                  <source src={aboutVideo} type="video/mp4" />
                </video>
                {!isPlaying && (
                  <div className="absolute inset-0 grid place-items-center bg-brand-dark/20">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={playVideo}
                      aria-label="تشغيل فيديو عن البيدر"
                      className="size-20 rounded-full border-2 border-story-foreground/70 bg-story-foreground/90 text-primary shadow-2xl hover:scale-105 hover:bg-story-foreground sm:size-24"
                    >
                      <Play className="size-8 fill-current sm:size-10" aria-hidden="true" />
                    </Button>
                    <span className="absolute bottom-6 right-6 font-secondary text-lg font-bold text-story-foreground">شاهد حكاية البيدر</span>
                  </div>
                )}
              </div>
              <p className="mt-8 border-r-2 border-brand-yellow pr-4 text-sm leading-7 text-muted-foreground sm:text-base">
                دقيقة واحدة تختصر كيف تبدأ الفكرة، ثم تكبر حين تجد من يحتضنها.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-24 grid gap-4 border-t border-border pt-12 sm:grid-cols-12">
          <figure className="relative overflow-hidden rounded-md sm:col-span-5">
            <img src={communityImage} alt="لقاء مجتمعي في البيدر" className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.03]" loading="lazy" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-brand-dark/80 px-5 py-4 font-secondary font-bold text-story-foreground">مجتمع يلتقي وينتمي</figcaption>
          </figure>
          <figure className="relative overflow-hidden rounded-md sm:col-span-4">
            <img src={guidanceImage} alt="جلسة تعليم وتوجيه في البيدر" className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.03]" loading="lazy" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-brand-olive/90 px-5 py-4 font-secondary font-bold text-story-foreground">معرفة تُشارك</figcaption>
          </figure>
          <figure className="relative overflow-hidden rounded-md sm:col-span-3">
            <img src={craftImage} alt="شباب يعملون على الحرف اليدوية في البيدر" className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.03] sm:h-full" loading="lazy" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-primary/90 px-5 py-4 font-secondary font-bold text-primary-foreground">أفكار تتحوّل إلى فعل</figcaption>
          </figure>
        </div>

        <div className="mt-16 grid gap-5 border-t border-border pt-12 sm:grid-cols-3">
          <div className="flex items-center gap-4"><UsersRound className="size-7 text-accent" aria-hidden="true" /><span className="font-secondary text-lg font-bold">مجتمع داعم</span></div>
          <div className="flex items-center gap-4"><Lightbulb className="size-7 text-brand-olive" aria-hidden="true" /><span className="font-secondary text-lg font-bold">مساحة للمبادرة</span></div>
          <div className="flex items-center gap-4"><Sparkles className="size-7 text-brand-yellow" aria-hidden="true" /><span className="font-secondary text-lg font-bold">أثر يستمر</span></div>
        </div>
      </div>
      <div className="relative mt-10 h-[15rem] overflow-hidden sm:mt-14 sm:h-[19rem]">
        <img src={buildingImage} alt="واجهة بيت البيدر الحجري في القدس" className="absolute inset-x-0 bottom-0 h-3/4 w-full object-cover opacity-15" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 via-35% to-background" />
      </div>
    </section>
  );
}