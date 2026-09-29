import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, MessageCircle, Music2, Phone, UsersRound } from "lucide-react";
import managerCard from "@/assets/amira-contact-card.png";
import locationMark from "@/assets/H-01-Locaiton.jpg";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — البيدر" },
      { name: "description", content: "تواصل مع مجتمع البيدر في القدس عبر الهاتف أو البريد الإلكتروني أو إنستغرام." },
      { property: "og:title", content: "تواصل معنا — البيدر" },
      { property: "og:description", content: "البيدر في جبل الزيتون، القدس — يسعدنا أن نرافقكم ونسمع منكم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const contactItems = [
  { image: locationMark, label: "الموقع", value: "القدس — جبل الزيتون", href: "https://www.google.com/maps/search/?api=1&query=Mount+of+Olives+Jerusalem" },
  { icon: Phone, label: "الهاتف", value: "054-432-1251", href: "tel:+972544321251" },
  { icon: Mail, label: "البريد الإلكتروني", value: "info@baydr.org", href: "mailto:info@baydr.org" },
];

const socialLinks = [
  { icon: Instagram, label: "إنستغرام", href: "https://www.instagram.com/al.baydr/", tone: "accent" },
  { icon: Facebook, label: "فيسبوك", href: "https://www.facebook.com/people/Al-Baydar/61591810820698/", tone: "primary" },
  { icon: Linkedin, label: "لينكدإن", href: "https://www.linkedin.com/company/al-baydar", tone: "sky" },
  { icon: Music2, label: "تيك توك", href: "https://www.tiktok.com/@albaydr1", tone: "dark" },
  { icon: MessageCircle, label: "واتساب", href: "https://api.whatsapp.com/send/?phone=972544321251&text&type=phone_number&app_absent=0", tone: "olive" },
  { icon: UsersRound, label: "مجموعة واتساب", href: "https://chat.whatsapp.com/IDQWaDgvgoo7E7T11h5wy0", tone: "yellow" },
] as const;

const toneStyles: Record<(typeof socialLinks)[number]["tone"], { card: string; chip: string }> = {
  accent: {
    card: "hover:border-accent",
    chip: "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground",
  },
  primary: {
    card: "hover:border-primary",
    chip: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  },
  sky: {
    card: "hover:border-brand-sky",
    chip: "bg-brand-sky/10 text-brand-sky group-hover:bg-brand-sky group-hover:text-primary-foreground",
  },
  dark: {
    card: "hover:border-foreground",
    chip: "bg-foreground/10 text-foreground group-hover:bg-foreground group-hover:text-background",
  },
  olive: {
    card: "hover:border-brand-olive",
    chip: "bg-brand-olive/10 text-brand-olive group-hover:bg-brand-olive group-hover:text-primary-foreground",
  },
  yellow: {
    card: "hover:border-brand-yellow",
    chip: "bg-brand-yellow/10 text-brand-dark group-hover:bg-brand-yellow group-hover:text-brand-dark",
  },
};


function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="bg-brand-dark text-story-foreground">
          <div className="mx-auto grid min-h-[34rem] max-w-6xl content-center gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="font-secondary text-lg font-bold text-story-highlight">نحب نسمع منكم</p>
              <h1 className="mt-3 font-main text-6xl leading-tight sm:text-8xl">تواصلوا معنا</h1>
              <p className="mt-6 max-w-2xl text-lg leading-9 text-story-muted">
                البيدر وجد لأننا نؤمن أن كل شاب يستحق من يرافقه في رحلته. ورش، إرشاد وفعاليات من قلب القدس.
              </p>
               <Button asChild variant="luminous" size="lg" className="mt-8">
                 <a href="https://www.instagram.com/al.baydr/" target="_blank" rel="noopener noreferrer">
                  <Instagram aria-hidden="true" /> تابعونا على إنستغرام
                </a>
              </Button>
            </div>
            <div className="border-r-4 border-story-highlight pr-6">
              <p className="font-main text-4xl leading-snug text-story-foreground sm:text-5xl">شارك، تعلّم، ابتكر.</p>
              <p className="mt-4 text-story-muted">كل تواصل ممكن يكون بداية لشيء جميل.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:items-start lg:py-28">
          <div>
            <p className="font-secondary text-lg font-bold text-accent">نحن قريبون</p>
            <h2 className="mt-2 font-main text-5xl text-primary sm:text-7xl">طرق التواصل</h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
               {contactItems.map(({ icon: Icon, image, label, value, href }) => (
                <a key={label} href={href} target={label === "الموقع" ? "_blank" : undefined} rel={label === "الموقع" ? "noreferrer" : undefined} className="group flex items-center gap-5 py-6 transition-colors hover:text-accent">
                   <span className="grid size-12 shrink-0 place-items-center overflow-hidden bg-brand-yellow text-brand-dark">
                     {image ? <img src={image} alt="" className="size-full object-cover" /> : Icon ? <Icon aria-hidden="true" /> : null}
                   </span>
                  <span>
                    <span className="block text-sm text-muted-foreground">{label}</span>
                    <span className="mt-1 block text-lg font-bold" dir={label === "البريد الإلكتروني" ? "ltr" : undefined}>{value}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <article className="border border-border bg-card p-4 shadow-sm">
            <img src={managerCard} alt="بطاقة تواصل أميرة غروف، مديرة البيدر" className="w-full bg-background object-contain" />
            <div className="px-2 pb-3 pt-6">
              <p className="font-secondary text-2xl font-bold text-primary">أميرة غروف</p>
              <p className="mt-1 text-muted-foreground">مديرة البيدر</p>
            </div>
          </article>
        </section>

         <section className="bg-muted py-20">
           <div className="mx-auto max-w-6xl px-5 sm:px-6">
             <div className="text-center">
               <h2 className="font-main text-5xl text-primary sm:text-7xl">كونوا قريبين</h2>
               <div className="mt-5 flex items-center justify-center gap-4">
                 <span className="h-[2px] w-12 rounded-full bg-brand-yellow/60" aria-hidden="true" />
                 <p className="font-secondary text-xl font-bold text-accent">البيدر معكم</p>
                 <span className="h-[2px] w-12 rounded-full bg-brand-yellow/60" aria-hidden="true" />
               </div>
             </div>
             <nav aria-label="روابط التواصل الاجتماعي" className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-5 sm:gap-8 md:grid-cols-3">
               {socialLinks.map(({ icon: Icon, label, href, tone }) => (
                 <a
                   key={label}
                   href={href}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={`group flex flex-col items-center justify-center rounded-3xl border-2 border-transparent bg-card p-6 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-xl sm:p-8 ${toneStyles[tone].card}`}
                 >
                   <span className={`mb-4 grid size-14 place-items-center rounded-2xl transition-all duration-500 sm:size-16 ${toneStyles[tone].chip}`}>
                     <Icon className="size-7 sm:size-8" aria-hidden="true" />
                   </span>
                   <span className="font-secondary text-lg font-bold text-primary">{label}</span>
                 </a>
               ))}
             </nav>
           </div>
         </section>
      </main>
      <SiteFooter />
    </div>
  );
}