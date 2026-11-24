import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Banknote, Landmark, Lock, Smartphone, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { contentQuery } from "@/lib/queries";
import { deliveryFeeFor, formatPKR, isValidPkMobile } from "@/lib/pricing";
import { mediaUrl } from "@/lib/content";
import { getVisitorId } from "@/lib/visitor";
import { supabase } from "@/lib/backend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Khaliq Rahim Medical Center" },
      { name: "description", content: "Complete your order of homeopathic medicines. Reserve for pickup and pay at the clinic." },
      { property: "og:title", content: "Checkout — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Reserve medicines for clinic pickup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { data } = useSuspenseQuery(contentQuery);
  const { lines, subtotal, clear, hydrated } = useCart();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const s = data.store;
  const fee = deliveryFeeFor(subtotal, s);
  const [method, setMethod] = useState("cod");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const methods = [
    { v: "cod", icon: Banknote, label: "Pay at the clinic", info: "Pay in cash when you collect your medicines.", show: true },
    { v: "jazzcash", icon: Smartphone, label: "JazzCash", info: `Send ${formatPKR(subtotal + fee)} to ${s.jazzcash_number} (${s.jazzcash_title}) and enter the transaction ID.`, show: !!s.jazzcash_number },
    { v: "easypaisa", icon: Wallet, label: "Easypaisa", info: `Send ${formatPKR(subtotal + fee)} to ${s.easypaisa_number} (${s.easypaisa_title}) and enter the transaction ID.`, show: !!s.easypaisa_number },
    { v: "bank", icon: Landmark, label: "Bank transfer", info: `${s.bank_name} · ${s.bank_account_title} · A/C ${s.bank_account_number}${s.bank_iban ? ` · IBAN ${s.bank_iban}` : ""}`, show: !!s.bank_account_number },
  ].filter((m) => m.show);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPkMobile(form.phone)) { toast.error("Please enter a valid mobile number, e.g. 0333-0501084"); return; }
    if (method !== "cod" && ref.trim().length < 4) { toast.error("Please enter your payment transaction ID"); return; }
    setBusy(true);
    const { data: res, error } = await supabase.rpc("place_order", {
      p_name: form.name, p_phone: form.phone, p_email: form.email, p_address: `Clinic pickup — ${data.clinic.address}`, p_city: "Clinic pickup", p_notes: form.notes,
      p_payment_method: method, p_payment_reference: method === "cod" ? "" : ref,
      p_items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })), p_visitor: getVisitorId(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const r = res as { order_number: string; total: number; phone: string };
    clear();
    void qc.invalidateQueries({ queryKey: ["catalog"] });
    navigate({ to: "/order-placed", search: { order: r.order_number, total: r.total, method } });
  };

  if (hydrated && lines.length === 0) {
    return (
      <section className="container-site py-24 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <Button asChild variant="hero" size="lg" className="mt-6"><Link to="/shop">Browse medicines</Link></Button>
      </section>
    );
  }

  return (
    <section className="container-site py-12 md:py-20">
      <h1 className="text-5xl font-medium md:text-6xl">Check<em className="italic text-gradient">out</em></h1>
      <form onSubmit={submit} className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
            <h2 className="text-2xl">Your details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pickup at {data.clinic.address} · {data.clinic.hours}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="n">Full name</Label><Input id="n" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-12" /></div>
              <div><Label htmlFor="p">Mobile / WhatsApp</Label><Input id="p" required inputMode="tel" placeholder="03xx-xxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 h-12" /></div>
              <div><Label htmlFor="e">Email (optional)</Label><Input id="e" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 h-12" /></div>
              <div><Label htmlFor="o">Order notes (optional)</Label><Input id="o" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1.5 h-12" /></div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft md:p-8">
            <h2 className="text-2xl">Payment</h2>
            <div className="mt-5 grid gap-3">
              {methods.map((m) => (
                <button type="button" key={m.v} onClick={() => setMethod(m.v)} aria-pressed={method === m.v}
                  className={cn("flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition", method === m.v ? "border-primary bg-secondary" : "border-border hover:border-primary/40")}>
                  <m.icon className={cn("mt-0.5 size-6", method === m.v ? "text-primary" : "text-muted-foreground")} />
                  <span><span className="block font-bold">{m.label}</span><span className="text-sm text-muted-foreground">{m.info}</span></span>
                </button>
              ))}
            </div>
            {method !== "cod" && (
              <div className="mt-4"><Label htmlFor="r">Transaction ID</Label><Input id="r" value={ref} onChange={(e) => setRef(e.target.value)} className="mt-1.5 h-12" placeholder="e.g. 123456789" /></div>
            )}
          </div>
        </div>
        <aside className="h-fit space-y-4 rounded-[2rem] bg-card p-7 shadow-soft lg:sticky lg:top-28">
          <h2 className="text-2xl">Your order</h2>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.product_id} className="flex items-center gap-3 text-sm">
                <img src={mediaUrl(l.image_url)} alt="" className="size-12 rounded-xl object-cover" />
                <span className="flex-1">{l.name} <span className="text-muted-foreground">× {l.quantity}</span></span>
                <span className="font-semibold">{formatPKR(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
            
            <div className="flex justify-between pt-2 text-xl"><span className="font-display">Total</span><span className="font-extrabold">{formatPKR(subtotal + fee)}</span></div>
          </div>
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy || lines.length === 0}>
            <Lock /> {busy ? "Reserving…" : "Reserve for pickup"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Our team will WhatsApp you when your medicines are ready.</p>
        </aside>
      </form>
    </section>
  );
}
