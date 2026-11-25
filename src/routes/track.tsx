import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Check, PackageSearch } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/pricing";
import { supabase } from "@/lib/backend";
import { cn } from "@/lib/utils";

type S = { order?: string };
type Tracked = {
  order_number: string; status: string; payment_status: string; payment_method: string; customer_name: string; city: string;
  subtotal: number; delivery_fee: number; total: number; created_at: string;
  items: { name: string; quantity: number; unit_price: number; line_total: number }[];
};

export const Route = createFileRoute("/track")({
  validateSearch: (s: Record<string, unknown>): S => (typeof s["order"] === "string" && s["order"] ? { order: s["order"].slice(0, 20) } : {}),
  head: () => ({
    meta: [
      { title: "Track Your Order — Khaliq Rahim Medical Center" },
      { name: "description", content: "Check the status of your homeopathic medicine order with your order number and mobile number." },
      { property: "og:title", content: "Track Your Order — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Enter your order number and phone to see your order status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Track,
});

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];
const LABEL: Record<string, string> = { pending: "Received", confirmed: "Confirmed", processing: "Packing", shipped: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };

function Track() {
  const search = Route.useSearch();
  const [num, setNum] = useState(search.order ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Tracked | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.rpc("track_order", { p_order_number: num, p_phone: phone });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data) { setRes(null); { toast.error("No order found with that number and phone"); return; } }
    setRes(data as unknown as Tracked);
  };
  const idx = res ? STEPS.indexOf(res.status) : -1;

  return (
    <section className="bg-hero">
      <div className="container-site max-w-3xl py-16 md:py-24">
        <PackageSearch className="size-12 text-primary" />
        <h1 className="mt-4 text-5xl font-medium md:text-6xl">Track your <em className="italic text-gradient">order</em></h1>
        <form onSubmit={submit} className="mt-8 grid gap-3 rounded-[2rem] bg-card p-6 shadow-soft sm:grid-cols-[1fr_1fr_auto]">
          <Input required placeholder="Order number, e.g. KR1001" value={num} onChange={(e) => setNum(e.target.value)} className="h-12" />
          <Input required inputMode="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12" />
          <Button type="submit" variant="hero" size="xl" disabled={busy}>{busy ? "Checking…" : "Track"}</Button>
        </form>
        {res && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[2rem] bg-card p-7 shadow-lift">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-3xl">{res.order_number}</p>
              <p className="text-sm text-muted-foreground">Placed {format(new Date(res.created_at), "d MMM yyyy, h:mm a")}</p>
            </div>
            {res.status === "cancelled" ? (
              <p className="mt-6 rounded-2xl bg-destructive/10 p-4 font-semibold text-destructive">This order was cancelled. Please contact the clinic for help.</p>
            ) : (
              <ol className="mt-8 grid grid-cols-5 gap-2">
                {STEPS.map((s, i) => (
                  <li key={s} className="text-center">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.12 }}
                      className={cn("mx-auto grid size-10 place-items-center rounded-full border-2", i <= idx ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                      {i <= idx ? <Check className="size-5" /> : i + 1}
                    </motion.span>
                    <span className={cn("mt-2 block text-xs font-semibold", i <= idx ? "text-primary" : "text-muted-foreground")}>{LABEL[s]}</span>
                  </li>
                ))}
              </ol>
            )}
            <ul className="mt-8 space-y-2 border-t border-border pt-5 text-sm">
              {res.items.map((it, i) => (
                <li key={i} className="flex justify-between"><span>{it.name} × {it.quantity}</span><span>{formatPKR(it.line_total)}</span></li>
              ))}
              <li className="flex justify-between"><span>Delivery</span><span>{res.delivery_fee ? formatPKR(res.delivery_fee) : "Free"}</span></li>
              <li className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span>{formatPKR(res.total)}</span></li>
              <li className="text-muted-foreground">Payment: {res.payment_method.toUpperCase()} · {res.payment_status}</li>
            </ul>
          </motion.div>
        )}
      </div>
    </section>
  );
}
