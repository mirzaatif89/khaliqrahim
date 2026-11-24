import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Eye, Search, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, Empty, Loading, PageTitle, StatusBadge, waLink } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/backend";
import type { Tables } from "@/integrations/supabase/types";
import { formatPKR } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: Customers });

function Customers() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Tables<"customers"> | null>(null);
  const data = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const [c, o] = await Promise.all([
        supabase.from("customers").select("*").order("last_seen_at", { ascending: false }).limit(1000),
        supabase.from("orders").select("customer_id, total, status").limit(5000),
      ]);
      if (c.error) throw c.error;
      const stats = new Map<string, { orders: number; spent: number }>();
      for (const r of o.data ?? []) {
        if (!r.customer_id || r.status === "cancelled") continue;
        const s = stats.get(r.customer_id) ?? { orders: 0, spent: 0 };
        s.orders += 1; s.spent += r.total;
        stats.set(r.customer_id, s);
      }
      return { customers: c.data, stats };
    },
  });
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data.data?.customers ?? []).filter((c) => !t || [c.name, c.phone, c.city, c.email].join(" ").toLowerCase().includes(t));
  }, [data.data, q]);

  return (
    <>
      <PageTitle title="Customers" subtitle="Everyone who ordered, booked or asked a question." />
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search name, phone, city" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-9" /></div>
      {data.isLoading ? <Loading /> : list.length === 0 ? <Empty>No customers yet.</Empty> : (
        <Card className="overflow-x-auto p-0 md:p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Name</th><th>Phone</th><th>City</th><th>Orders</th><th>Spent</th><th>Last active</th></tr></thead>
            <tbody className="divide-y divide-border">
              {list.map((c) => {
                const s = data.data?.stats.get(c.id);
                return (
                  <tr key={c.id} onClick={() => setSel(c)} className="cursor-pointer hover:bg-secondary/40">
                    <td className="p-4 font-semibold">{c.name}</td><td>{c.phone}</td><td>{c.city ?? "—"}</td><td>{s?.orders ?? 0}</td><td>{formatPKR(s?.spent ?? 0)}</td>
                    <td className="text-muted-foreground">{formatDistanceToNow(new Date(c.last_seen_at), { addSuffix: true })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <CustomerSheet customer={sel} onClose={() => setSel(null)} />
    </>
  );
}

function CustomerSheet({ customer, onClose }: { customer: Tables<"customers"> | null; onClose: () => void }) {
  const d = useQuery({
    queryKey: ["admin", "customer", customer?.id],
    enabled: !!customer,
    queryFn: async () => {
      const id = customer!.id;
      const [o, a, i] = await Promise.all([
        supabase.from("orders").select("id, order_number, total, status, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
        supabase.from("appointments").select("id, ticket_number, preferred_date, status, consultation_type").eq("customer_id", id).order("preferred_date", { ascending: false }),
        supabase.rpc("admin_customer_interests", { p_customer_id: id }),
      ]);
      return { orders: o.data ?? [], appts: a.data ?? [], interests: i.data ?? [] };
    },
  });
  if (!customer) return null;
  const c = customer;
  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle className="font-display text-2xl">{c.name}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-6 text-sm">
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p>{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
            {c.address && <p className="mt-1 text-muted-foreground">{c.address}, {c.city}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Customer since {format(new Date(c.created_at), "d MMM yyyy")}</p>
            <Button asChild variant="whatsapp" size="sm" className="mt-3"><a href={waLink(c.phone, `Assalam o Alaikum ${c.name}, this is Khaliq Rahim Medical Center.`)} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp</a></Button>
          </div>
          <div>
            <p className="font-semibold">Products of interest</p>
            {d.data?.interests.length === 0 && <p className="mt-2 text-muted-foreground">No browsing activity recorded yet.</p>}
            <ul className="mt-2 space-y-2">
              {d.data?.interests.map((x) => (
                <li key={x.product_id} className="rounded-xl border border-border p-3">
                  <p className="font-semibold">{x.name}</p>
                  <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="size-3" /> {x.views} views</span>
                    <span className="flex items-center gap-1"><ShoppingCart className="size-3" /> {x.carts} added to cart</span>
                    <span>{x.whatsapp} WhatsApp · {x.inquiries} inquiries · {x.purchases} bought</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Orders</p>
            <ul className="mt-2 divide-y divide-border">
              {d.data?.orders.length === 0 && <li className="py-2 text-muted-foreground">No orders.</li>}
              {d.data?.orders.map((o) => <li key={o.id} className="flex items-center justify-between py-2"><span>{o.order_number} · {format(new Date(o.created_at), "d MMM yyyy")}</span><span className="flex items-center gap-2">{formatPKR(o.total)} <StatusBadge status={o.status} /></span></li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Appointments</p>
            <ul className="mt-2 divide-y divide-border">
              {d.data?.appts.length === 0 && <li className="py-2 text-muted-foreground">No appointments.</li>}
              {d.data?.appts.map((a) => <li key={a.id} className="flex items-center justify-between py-2"><span>{a.ticket_number} · {a.preferred_date}</span><StatusBadge status={a.status} /></li>)}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
