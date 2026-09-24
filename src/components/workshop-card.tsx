import { Link } from "@tanstack/react-router";
import type { Workshop } from "@/lib/workshops";
import { formatWorkshopDate, formatWorkshopTime } from "@/lib/workshop-schedule";

export function WorkshopCard({ workshop }: { workshop: Workshop }) {
  return (
    <Link
      to="/workshops/$slug"
      params={{ slug: workshop.slug }}
      className="group overflow-hidden rounded-md border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-accent"
    >
      <div className="overflow-hidden">
        <img
          src={workshop.image}
          alt={workshop.title}
          loading="lazy"
          width={1024}
          height={768}
          className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="border-r-2 border-accent pr-2 text-xs font-bold text-accent">{workshop.category}</span>
          <span className="text-xs text-muted-foreground">{formatWorkshopDate(workshop.day)} · {formatWorkshopTime(workshop.time)}</span>
        </div>
        <h3 className="mt-3 font-display text-3xl transition-colors group-hover:text-accent">{workshop.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{workshop.excerpt}</p>
        <p className={workshop.isFull ? "mt-4 text-sm font-bold text-destructive" : "mt-4 text-sm font-bold text-success"}>
          {workshop.isFull ? `مكتملة الحجوزات · ${workshop.capacity} مقعد` : `${workshop.remaining} متبقي من ${workshop.capacity} مقعد`}
        </p>
      </div>
    </Link>
  );
}