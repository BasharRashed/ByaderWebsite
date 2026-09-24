import wordmark from "@/assets/albaydar-wordmark-clean.png";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <img src={wordmark} alt="البيدر" className="h-12 w-auto" />
        <p className="text-sm text-muted-foreground">مساحة بتتعلّم فيها، تلتقي، وتعمل أثر</p>
      </div>
    </footer>
  );
}