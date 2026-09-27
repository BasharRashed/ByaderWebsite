import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileSpreadsheet, Search, Trash2 } from "lucide-react";
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

export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const setAll = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  const clear = () => setSelected(new Set());
  return { selected, toggle, setAll, clear };
}

type Selection = ReturnType<typeof useSelection>;

export function SelectAllCheckbox({ selection, ids }: { selection: Selection; ids: string[] }) {
  const all = ids.length > 0 && ids.every((id) => selection.selected.has(id));
  return (
    <input
      type="checkbox"
      aria-label="تحديد الكل"
      checked={all}
      onChange={(e) => selection.setAll(ids, e.target.checked)}
      className="size-4 accent-primary"
    />
  );
}

export function RowCheckbox({ selection, id, label }: { selection: Selection; id: string; label: string }) {
  return (
    <input
      type="checkbox"
      aria-label={`تحديد ${label}`}
      checked={selection.selected.has(id)}
      onChange={() => selection.toggle(id)}
      className="size-4 accent-primary"
    />
  );
}

export function BulkDeleteBar({
  selection,
  noun,
  warning,
  pending,
  onDelete,
}: {
  selection: Selection;
  noun: string;
  warning?: string;
  pending: boolean;
  onDelete: (ids: string[]) => void;
}) {
  const count = selection.selected.size;
  if (count === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm">
      <span>تم تحديد {count} {noun}</span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={selection.clear}>إلغاء التحديد</Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (confirm(`حذف ${count} ${noun}؟${warning ? `\n${warning}` : ""}`)) onDelete([...selection.selected]);
          }}
        >
          <Trash2 className="size-3.5" aria-hidden="true" /> حذف المحدد
        </Button>
      </div>
    </div>
  );
}

export async function exportToExcel(fileName: string, rows: Record<string, string | number>[]) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 24 }));
  const book = XLSX.utils.book_new();
  book.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(book, sheet, "Sheet1");
  XLSX.writeFile(book, `${fileName}.xlsx`);
}

export function ExportButton({ fileName, rows }: { fileName: string; rows: () => Record<string, string | number>[] }) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        const data = rows();
        if (data.length === 0) return alert("لا توجد بيانات للتصدير.");
        void exportToExcel(fileName, data);
      }}
    >
      <FileSpreadsheet className="size-4" aria-hidden="true" /> تصدير Excel
    </Button>
  );
}
