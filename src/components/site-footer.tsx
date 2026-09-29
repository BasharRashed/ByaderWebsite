import wordmark from "@/assets/albaydar-multilingual-wordmark.png";
import { Facebook, Instagram, Linkedin, MessageCircle, Music2, UsersRound } from "lucide-react";

const socialLinks = [
  { label: "إنستغرام", href: "https://www.instagram.com/al.baydr/", icon: Instagram },
  { label: "فيسبوك", href: "https://www.facebook.com/people/Al-Baydar/61591810820698/", icon: Facebook },
  { label: "لينكدإن", href: "https://www.linkedin.com/company/al-baydar", icon: Linkedin },
  { label: "تيك توك", href: "https://www.tiktok.com/@albaydr1", icon: Music2 },
  { label: "واتساب", href: "https://api.whatsapp.com/send/?phone=972544321251&text&type=phone_number&app_absent=0", icon: MessageCircle },
  { label: "مجموعة واتساب", href: "https://chat.whatsapp.com/IDQWaDgvgoo7E7T11h5wy0", icon: UsersRound },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-7 px-6 sm:flex-row">
        <img src={wordmark} alt="البيدر — AlBaydar — אלביידר" className="h-20 w-auto max-w-full object-contain sm:h-24" />
        <div className="flex flex-col items-center gap-4 sm:items-end">
          <p className="text-center text-sm leading-7 text-muted-foreground sm:text-right">مساحة بتتعلّم فيها، تلتقي، وتعمل أثر</p>
          <nav aria-label="روابط البيدر الاجتماعية" className="flex flex-wrap justify-center gap-2 sm:justify-end">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="grid size-10 place-items-center rounded-full border border-border text-primary transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}