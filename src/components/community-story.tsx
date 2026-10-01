import DSC05898 from "/src/assets/DSC05898.webp";
import DSC05918 from "/src/assets/DSC05918.webp";
import DSC05930 from "/src/assets/DSC05930.webp";
import DSC05950 from "/src/assets/DSC05950.webp";
import DSC05961 from "/src/assets/DSC05961.webp";
import spacesBackdrop from "/src/assets/albaydar-spaces-backdrop.webp";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type StoryStyle = CSSProperties & {
  "--room-expand": number;
  "--room-copy-opacity": number;
};

const rooms = [
  {
    icon: "🎥",
    title: "المساحة الكبيرة",
    type: "قاعة مرنة",
    lead: "لما العدد يكبر… منكبر المساحة!",
    text: "اجتماعات، تدريبات، عروض، فعاليات وأكثر — والمساحة بتتغيّر حسب احتياجكم.",
    image: DSC05898,
  },
  {
    icon: "☕",
    title: "الخابية",
    type: "المطبخ والمساحة الاجتماعية",
    lead: "مش كل شيء تعلّم 😌",
    text: "مكان للقهوة، الاستراحة، الحكي… وحتى شوي لعب بين النشاطات.",
    image: DSC05918,
  },
  {
    icon: "🎓",
    title: "الغرس",
    type: "غرفة التدريب والورشات",
    lead: "هون بتبدأ الأفكار!",
    text: "دورات، ورشات، تدريبات واجتماعات… والمساحة متاحة كمان للإيجار.",
    image: DSC05930,
  },
  {
    icon: "📚",
    title: "الحصاد",
    type: "مساحة الطلاب",
    lead: "هون فيك تركز 🌿",
    text: "مكان هادي للي بده يركز، يدرس، يشتغل أو ينجز شغله بعيد عن الضجة.",
    image: DSC05950,
  },
  {
    icon: "🗂️",
    title: "المكتب",
    type: "الاستقبال والإدارة",
    lead: "هون بتنظّم كل تفصيلة!",
    text: "استقبال، تنسيق، ومتابعة… من المكتب بتُدار الزيارات والطلبات وكل تفاصيل اليوم.",
    image: DSC05961,
  },
];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};

export function CommunityStory() {
  const storyTrackRef = useRef<HTMLDivElement>(null);
  const [activeRoom, setActiveRoom] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const storyTrack = storyTrackRef.current;
    if (!storyTrack) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = storyTrack.getBoundingClientRect();
      const availableTravel = Math.max(1, storyTrack.offsetHeight - window.innerHeight);
      const nextOverallProgress = clamp(-rect.top / availableTravel);
      const imageProgress = clamp((nextOverallProgress - 0.1) / 0.9);
      const nextRoom = Math.min(rooms.length - 1, Math.floor(imageProgress * rooms.length));

      setActiveRoom(nextRoom);
      setOverallProgress(nextOverallProgress);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const currentRoom = rooms[activeRoom];
  if (!currentRoom) return null;

  const imageProgress = clamp((overallProgress - 0.1) / 0.9);
  const roomPosition = imageProgress * rooms.length;
  const roomProgress = activeRoom === rooms.length - 1 && imageProgress === 1
    ? 1
    : roomPosition - activeRoom;
  const fadeIn = smoothstep(roomProgress / 0.16);
  const fadeOut = activeRoom === rooms.length - 1
    ? 1
    : 1 - smoothstep((roomProgress - 0.8) / 0.16);
  const copyOpacity = prefersReducedMotion ? 1 : fadeIn * fadeOut;
  const expand = prefersReducedMotion ? 1 : smoothstep(overallProgress / 0.1);
  const style: StoryStyle = {
    "--room-expand": expand,
    "--room-copy-opacity": copyOpacity,
  };

  return (
    <section
      id="community"
      className="relative scroll-mt-16 bg-background"
      aria-label="مساحات البيدر"
      style={style}
    >
      <div className="mx-auto max-w-6xl bg-background px-5 pb-8 pt-2 text-right sm:px-6 sm:pb-10">
        <h2 className="font-display text-5xl text-primary sm:text-7xl">مساحات البيدر</h2>
      </div>
      <div ref={storyTrackRef} className="relative h-[760svh]">
        <div className="sticky top-0 h-svh overflow-hidden bg-brand-dark">
          <img
            src={spacesBackdrop}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-75 blur-sm"
          />
          <div className="absolute inset-0 bg-background/15" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-gradient-to-b from-background via-background/55 to-transparent" />

          <div className="room-story-media absolute z-10 overflow-hidden border border-story-foreground/25 bg-story-surface shadow-2xl">
            <AnimatePresence initial={false} mode="sync">
              <motion.img
                key={currentRoom.image}
                src={currentRoom.image}
                alt={`صورة ${currentRoom.title} في البيدر`}
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.85, ease: "easeInOut" }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/75 via-transparent to-brand-dark/20" />
          </div>

          <article className="room-story-copy absolute inset-x-5 bottom-[9%] z-30 mx-auto max-w-2xl border-r-4 border-story-highlight bg-story-surface/90 px-6 py-5 text-right text-story-foreground shadow-2xl backdrop-blur-md sm:bottom-[8%] sm:px-8 sm:py-7">
            <div className="mb-3 flex items-start justify-between gap-5">
              <div>
                <p className="font-secondary text-sm font-bold text-story-highlight">{currentRoom.type}</p>
                <h3 className="mt-1 flex items-center gap-2 font-display text-4xl leading-tight text-story-foreground sm:text-6xl">
                  <span aria-hidden="true" className="text-2xl sm:text-3xl">{currentRoom.icon}</span>
                  {currentRoom.title}
                </h3>
              </div>
              <span className="font-display text-3xl text-story-highlight" aria-label={`المساحة ${activeRoom + 1} من ${rooms.length}`}>
                {String(activeRoom + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="font-secondary text-base font-bold text-story-highlight sm:text-lg">{currentRoom.lead}</p>
            <p className="mt-2 text-base leading-8 text-story-muted sm:text-lg sm:leading-9">{currentRoom.text}</p>
          </article>

          <div className="absolute inset-x-5 bottom-4 z-30 mx-auto flex max-w-xs items-center gap-2" aria-hidden="true">
            {rooms.map((room, index) => (
              <span key={`${room.title}-step`} className={`h-1 flex-1 transition-colors duration-700 ${index <= activeRoom ? "bg-story-highlight" : "bg-story-foreground/20"}`} />
            ))}
          </div>

          <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-40 h-40 bg-gradient-to-b from-transparent to-background transition-opacity duration-700 ${activeRoom === rooms.length - 1 && roomProgress > 0.72 ? "opacity-100" : "opacity-0"}`} />
        </div>
      </div>

    </section>
  );
}

export function CommunityClosing() {
  return (
    <section aria-label="البيدر مش بس مكان">
      <div className="bg-background px-5 py-12 text-center sm:py-16">
        <p className="font-display text-5xl leading-tight text-primary sm:text-7xl">البيدر مش بس مكان…</p>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-9 text-muted-foreground sm:text-2xl sm:leading-10">
          هو مساحة بتتعلّم فيها، تشتغل، تلتقي، وتعمل أثر.
        </p>
      </div>
    </section>
  );
}
