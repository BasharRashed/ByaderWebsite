import { useEffect, useRef, useState } from "react";
import makerRoom from "@/assets/room-maker.jpg";
import loungeRoom from "@/assets/room-lounge.jpg";
import courtyardRoom from "@/assets/room-courtyard.jpg";
import makerMotion from "@/assets/room-maker-motion.mp4.asset.json";
import loungeMotion from "@/assets/room-lounge-motion.mp4.asset.json";
import courtyardMotion from "@/assets/room-courtyard-motion.mp4.asset.json";

const rooms = [
  { image: makerRoom, video: makerMotion.url, title: "قاعة الحِرف", text: "مساحة حيّة للورش والتجربة، حيث تتحوّل الأفكار إلى أشياء نصنعها بأيدينا." },
  { image: loungeRoom, video: loungeMotion.url, title: "ركن اللقاء", text: "مكان هادئ للجلوس والقراءة وتبادل الأفكار بين ورشة وأخرى." },
  { image: courtyardRoom, video: courtyardMotion.url, title: "ساحة البيدر", text: "مساحة مفتوحة نلتقي فيها، نعرض ما صنعناه، ونشارك التجربة مع المجتمع." },
];

export function CommunityStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [activeRoom, setActiveRoom] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const traveled = Math.max(0, -rect.top);
      const nextRoom = Math.min(rooms.length - 1, Math.floor((traveled + window.innerHeight * 0.45) / window.innerHeight));
      setActiveRoom(nextRoom);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === activeRoom) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [activeRoom]);

  const currentRoom = rooms[activeRoom];
  if (!currentRoom) return null;

  return (
    <section id="community" ref={sectionRef} className="relative h-[300svh] scroll-mt-16 bg-foreground">
      <div className="sticky top-0 h-svh overflow-hidden">
        {rooms.map((room, index) => (
          <div key={room.title} className={`absolute inset-0 transition-opacity duration-1000 ${activeRoom === index ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <img src={room.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <video ref={(node) => { videoRefs.current[index] = node; }} src={room.video} poster={room.image} muted autoPlay loop playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" />
            <div className="story-veil absolute inset-0" />
          </div>
        ))}
        <div className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-56 bg-gradient-to-b from-background via-background/60 to-transparent transition-opacity duration-700 ${activeRoom === 0 ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute inset-0 z-10 flex items-center px-5 sm:px-10 lg:px-16 ${activeRoom % 2 ? "justify-end" : "justify-start"}`}>
          <article key={currentRoom.title} className="story-caption relative w-[min(22rem,calc(100vw-2.5rem))] border border-story-foreground/20 bg-story-surface/65 px-6 py-6 shadow-2xl backdrop-blur-md sm:w-80 sm:px-7 sm:py-7">
            <span className="absolute inset-y-5 -right-px w-1 rounded-full bg-story-highlight shadow-[0_0_18px_color-mix(in_oklab,var(--story-highlight)_55%,transparent)]" />
            <div className="mb-3 flex items-center justify-between gap-4 text-story-highlight">
              <span className="text-xs font-bold">من مساحات البيدر</span>
              <span className="font-display text-2xl" aria-hidden="true">{String(activeRoom + 1).padStart(2, "0")}</span>
            </div>
            <h2 className="font-display text-5xl leading-tight text-story-foreground sm:text-6xl">{currentRoom.title}</h2>
            <p className="mt-3 text-sm leading-7 text-story-muted sm:text-base">{currentRoom.text}</p>
          </article>
        </div>
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 h-44 bg-gradient-to-b from-transparent to-background transition-opacity duration-700 ${activeRoom === rooms.length - 1 ? "opacity-100" : "opacity-0"}`} />
      </div>
    </section>
  );
}