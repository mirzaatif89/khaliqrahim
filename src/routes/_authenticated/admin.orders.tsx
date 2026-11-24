import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MapPin, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, Empty, Loading, PageTitle, StatusBadge, waLink } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/backend";
import type { Tables } from "@/integrations/supabase/types";
import { formatPKR } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: Orders });

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAY = ["pending", "paid", "failed", "refunded"];

function Orders() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Tables<"orders"> | null>(null);
  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (orders.data ?? []).filter((o) => (filter === "all" || o.status === filter) && (!t || [o.order_number, o.customer_name, o.phone, o.city].join(" ").toLowerCase().includes(t)));
  }, [orders.data, filter, q]);

  return (
    <>
      <PageTitle title="Orders" subtitle="Confirm, dispatch and track every medicine order." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search order #, name, phone, city" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-9" /></div>
        <div className="flex gap-1.5 overflow-x-auto">
          {["all", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn("shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold capitalize", filter === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>{s}</button>
          ))}
        </div>
      </div>
      {orders.isLoading ? <Loading /> : list.length === 0 ? <Empty>No orders found.</Empty> : (
        <Card className="overflow-x-auto p-0 md:p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Order</th><th>Date</th><th>Customer</th><th>City</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
            <tbody className="divide-y divide-border">
              {list.map((o) => (
                <tr key={o.id} onClick={() => setSel(o)} className="cursor-pointer transition hover:bg-secondary/40">
                  <td className="p-4 font-bold">{o.order_number}</td>
                  <td>{format(new Date(o.created_at), "d MMM, h:mm a")}</td>
                  <td>{o.customer_name}<br /><span className="text-xs text-muted-foreground">{o.phone}</span></td>
                  <td>{o.city}</td>
                  <td><span className="uppercase">{o.payment_method}</span> <StatusBadge status={o.payment_status} /></td>
                  <td className="font-semibold">{formatPKR(o.total)}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <OrderSheet order={sel} onClose={() => setSel(null)} />
    </>
  );
}

function OrderSheet({ order, onClose }: { order: Tables<"orders"> | null; onClose: () => void }) {
  const qc = useQueryClient();
  const items = useQuery({
    queryKey: ["admin", "order-items", order?.id],
    enabled: !!order,
    queryFn: async () => (await supabase.from("order_items").select("*").eq("order_id", order!.id)).data ?? [],
  });
  const [notes, setNotes] = useState<string | null>(null);
  const update = useMutation({
    mutationFn: async (patch: Partial<Tables<"orders">>) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", order!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Order updated"); void qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!order) return null;
  const o = order;
  return (
    <Sheet open={!!order} onOpenChange={(v) => { if (!v) { onClose(); setNotes(null); } }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle className="font-display text-2xl">Order {o.order_number}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="mb-1 text-xs font-semibold text-muted-foreground">Order status</p>
              <Select defaultValue={o.status} onValueChange={(v) => update.mutate({ status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
            <div><p className="mb-1 text-xs font-semibold text-muted-foreground">Payment</p>
              <Select defaultValue={o.payment_status} onValueChange={(v) => update.mutate({ payment_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAY.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="rounded-2xl bg-secondary/50 p-4">
            <p className="font-semibold">{o.customer_name}</p>
            <p className="mt-1 flex items-center gap-2"><Phone className="size-3.5" /> <a href={`tel:${o.phone}`} className="text-primary">{o.phone}</a></p>
            <p className="mt-1 flex items-start gap-2"><MapPin className="mt-0.5 size-3.5" /> {o.address}, {o.city}</p>
            {o.email && <p className="mt-1">{o.email}</p>}
            {o.notes && <p className="mt-2 italic text-muted-foreground">“{o.notes}”</p>}
            <Button asChild variant="whatsapp" size="sm" className="mt-3">
              <a href={waLink(o.phone, `Assalam o Alaikum ${o.customer_name}, this is Khaliq Rahim Medical Center about your order ${o.order_number} (${formatPKR(o.total)}).`)} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp customer</a>
            </Button>
          </div>
          <div>
            <p className="font-semibold">Items</p>
            <ul className="mt-2 divide-y divide-border">
              {(items.data ?? []).map((it) => (<li key={it.id} className="flex justify-between py-2"><span>{it.product_name} × {it.quantity}</span><span>{formatPKR(it.line_total)}</span></li>))}
              <li className="flex justify-between py-2 text-muted-foreground"><span>Delivery</span><span>{formatPKR(o.delivery_fee)}</span></li>
              <li className="flex justify-between py-2 text-base font-bold"><span>Total</span><span>{formatPKR(o.total)}</span></li>
            </ul>
            <p className="mt-1 text-muted-foreground">Method: <span className="uppercase">{o.payment_method}</span>{o.payment_reference ? ` · Ref ${o.payment_reference}` : ""}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold">Internal notes</p>
            <Textarea value={notes ?? o.admin_notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. courier tracking number" />
            <Button className="mt-2" variant="hero" size="sm" disabled={notes === null || update.isPending} onClick={() => update.mutate({ admin_notes: notes })}>Save notes</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
