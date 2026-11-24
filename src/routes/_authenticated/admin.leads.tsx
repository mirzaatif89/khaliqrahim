import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Empty, Loading, PageTitle, waLink } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/site/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/backend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/leads")({ component: Leads });

const STATUSES = ["new", "contacted", "converted", "closed"];
const SOURCE: Record<string, string> = { product_inquiry: "Product question", contact: "Contact form", callback: "Call back" };

function Leads() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("new");
  const d = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*, products(name)").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const list = (d.data ?? []).filter((l) => filter === "all" || l.status === filter);
  return (
    <>
      <PageTitle title="Inquiries" subtitle="Questions from the contact form and product pages."
        actions={["new", "contacted", "converted", "closed", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full px-3.5 py-2 text-sm font-semibold capitalize", filter === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>{s}</button>
        ))}
      />
      {d.isLoading ? <Loading /> : list.length === 0 ? <Empty>No inquiries here.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((l) => (
            <Card key={l.id}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-semibold">{l.name}</p><p className="text-sm text-muted-foreground">{l.phone}{l.email ? ` · ${l.email}` : ""}</p></div>
                <span className="text-xs text-muted-foreground">{format(new Date(l.created_at), "d MMM, h:mm a")}</span>
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-primary">{SOURCE[l.source]}{l.products ? ` · ${l.products.name}` : ""}</p>
              {l.message && <p className="mt-2 rounded-xl bg-muted p-3 text-sm">{l.message}</p>}
              <div className="mt-4 flex items-center gap-2">
                <Select defaultValue={l.status} onValueChange={(v) => update.mutate({ id: l.id, status: v })}>
                  <SelectTrigger className="h-9 flex-1 capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
                <a href={waLink(l.phone, `Assalam o Alaikum ${l.name}, this is Khaliq Rahim Medical Center regarding your question.`)} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground" aria-label="WhatsApp"><WhatsAppIcon className="size-4" /></a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
