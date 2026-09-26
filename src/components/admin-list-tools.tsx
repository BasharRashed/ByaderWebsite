import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminView = "workshops" | "completed" | "bookings" | "contacts";
export const SECTION_LIMIT = 5;

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-64 max-w-full pr-9"
      />
    </div>
  );
}

export function ShowAllLink({ section, total, limit }: { section: AdminView; total: number; limit: number | undefined }) {
  if (limit === undefined || total <= limit) return null;
  return (
    <div className="mt-4 flex justify-center">
      <Button asChild variant="outline">
        <Link to="/admin" search={{ view: section }}>
          عرض الكل ({total})
        </Link>
      </Button>
    </div>
  );
}
