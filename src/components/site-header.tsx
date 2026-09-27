import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/albaydar-icon.png.asset.json";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link to="/" aria-label="البيدر">
          <img src={logo.url} alt="شعار البيدر" className="size-11 rounded-sm object-cover" />
        </Link>
        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <Link to="/workshops" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            ورش العمل
          </Link>
          <Link to="/" hash="about" className="transition-colors hover:text-foreground">
            عن البيدر
          </Link>
          <Link to="/" hash="community" className="transition-colors hover:text-foreground">
            مساحات البيدر
          </Link>
        </nav>
        <Button asChild variant="luminous" size="sm">
          <Link to="/workshops">احجز مقعدك</Link>
        </Button>
      </div>
    </header>
  );
}