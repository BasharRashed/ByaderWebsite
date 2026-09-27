import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { adminListContacts, adminSetContactSubscribed, adminDeleteContacts } from "@/lib/admin.functions";
import { SearchBox, ShowAllLink, useSelection, SelectAllCheckbox, RowCheckbox, BulkDeleteBar, ExportButton } from "@/components/admin-list-tools";

function WorkshopList({ workshops }: { workshops: string[] }) {
  const [open, setOpen] = useState(false);
  if (workshops.length === 0) return <span className="text-muted-foreground">—</span>;
  if (workshops.length === 1) {
    return <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">{workshops[0]}</span>;
  }
  return (
    <div className="min-w-44">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
      >
        {workshops.length} ورش
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open ? (
        <ol className="mt-2 space-y-1 border-r-2 border-accent/40 pr-3 text-xs">
          {workshops.map((title, index) => (
            <li key={`${title}-${index}`} className="text-foreground">{title}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function ContactsSection({ creds, limit }: { creds: { username: string; password: string }; limit?: number | undefined }) {
  const queryClient = useQueryClient();
  const listContacts = useServerFn(adminListContacts);
  const setSubscribed = useServerFn(adminSetContactSubscribed);
  const deleteContacts = useServerFn(adminDeleteContacts);
  const selection = useSelection();
  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteContacts({ data: { ...creds, ids } }),
    onSuccess: () => {
      selection.clear();
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });
  const [onlySubscribed, setOnlySubscribed] = useState(false);
  const [search, setSearch] = useState("");
  const contactsQuery = useQuery({
    queryKey: ["admin", "contacts"],
    queryFn: () => listContacts({ data: creds }),
  });
  const subscribeMutation = useMutation({
    mutationFn: (input: { id: string; subscribed: boolean }) =>
      setSubscribed({ data: { ...creds, ...input } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] }),
  });
  const query = search.trim().toLowerCase();
  const contacts = (contactsQuery.data ?? []).filter(
    (c) =>
      (!onlySubscribed || c.subscribed) &&
      (!query || [c.name, c.phone, c.email].some((field) => field.toLowerCase().includes(query))),
  );

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-4xl text-primary">جهات الاتصال</h2>
        <div className="flex flex-wrap items-center gap-4">
          <ExportButton
            fileName="جهات الاتصال"
            rows={() => contacts.map((c) => ({ "الاسم": c.name, "الهاتف": c.phone, "البريد": c.email, "الورش المسجّل فيها": c.workshops.join("، "), "الأخبار": c.subscribed ? "مشترك" : "غير مشترك" }))}
          />
          <SearchBox value={search} onChange={setSearch} placeholder="ابحث بالاسم أو الهاتف أو البريد" />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={onlySubscribed} onChange={(e) => setOnlySubscribed(e.target.checked)} className="size-4 accent-primary" />
            المشتركون بالأخبار فقط
          </label>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><SelectAllCheckbox selection={selection} ids={contacts.slice(0, limit).map((c) => c.id)} /></TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">البريد</TableHead>
              <TableHead className="text-right">الورش المسجّل فيها</TableHead>
              <TableHead className="text-right">الأخبار</TableHead>
              <TableHead className="text-right">حذف</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactsQuery.isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center"><Loader2 className="mx-auto size-4 animate-spin" /></TableCell></TableRow>
            ) : contacts.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{query ? "لا توجد نتائج مطابقة." : "لا توجد جهات اتصال بعد."}</TableCell></TableRow>
            ) : (
              contacts.slice(0, limit).map((contact) => (
                <TableRow key={contact.id} className="align-top">
                  <TableCell><RowCheckbox selection={selection} id={contact.id} label={contact.name} /></TableCell>
                  <TableCell className="font-bold">{contact.name}</TableCell>
                  <TableCell dir="ltr" className="text-right">{contact.phone}</TableCell>
                  <TableCell dir="ltr" className="text-right">{contact.email}</TableCell>
                  <TableCell><WorkshopList workshops={contact.workshops} /></TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={subscribeMutation.isPending}
                      className={contact.subscribed ? "border-success text-success" : "text-muted-foreground"}
                      onClick={() => subscribeMutation.mutate({ id: contact.id, subscribed: !contact.subscribed })}
                    >
                      {contact.subscribed ? "مشترك" : "غير مشترك"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={`حذف ${contact.name}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm(`حذف «${contact.name}» وكل حجوزاته؟`)) deleteMutation.mutate([contact.id]);
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <BulkDeleteBar selection={selection} noun="جهة اتصال" warning="سيتم حذف كل حجوزاتهم أيضاً." pending={deleteMutation.isPending} onDelete={(ids) => deleteMutation.mutate(ids)} />
      <ShowAllLink section="contacts" total={contacts.length} limit={limit} />
    </section>
  );
}
