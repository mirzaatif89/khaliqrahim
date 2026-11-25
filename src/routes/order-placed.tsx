import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/icons";
import { contentQuery } from "@/lib/queries";
import { formatPKR } from "@/lib/pricing";
import { whatsappLink } from "@/lib/content";

type S = { order?: string; total?: number; method?: string };

export const Route = createFileRoute("/order-placed")({
  validateSearch: (s: Record<string, unknown>): S => {
    const out: S = {};
    if (typeof s["order"] === "string") out.order = s["order"].slice(0, 20);
    const t = Number(s["total"]);
    if (Number.isFinite(t)) out.total = t;
    if (typeof s["method"] === "string") out.method = s["method"].slice(0, 20);
    return out;
  },
  head: () => ({
    meta: [
      { title: "Order placed — Khaliq Rahim Medical Center" },
      { name: "description", content: "Thank you for your order. Our team will confirm it on WhatsApp." },
      { property: "og:title", content: "Order placed — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Thank you for ordering from Khaliq Rahim Medical Center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPlaced,
});

function OrderPlaced() {
  const { order, total, method } = Route.useSearch();
  const { data } = useSuspenseQuery(contentQuery);
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="container-site flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 160, damping: 12 }}>
          <CheckCircle2 className="size-24 text-success" />
        </motion.div>
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/3 size-3 rounded-full bg-accent"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos((i / 14) * Math.PI * 2) * 220, y: Math.sin((i / 14) * Math.PI * 2) * 160, opacity: 0 }}
            transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
          />
        ))}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 text-5xl font-medium md:text-6xl">
          Thank you! <em className="italic text-gradient">Order placed.</em>
        </motion.h1>
        {order && <p className="mt-6 text-lg">Your order number is <span className="rounded-full bg-primary px-4 py-1.5 font-display text-2xl text-primary-foreground">{order}</span></p>}
        {total != null && <p className="mt-4 text-muted-foreground">Total {formatPKR(total)} · {method === "cod" ? "Pay cash when your order is delivered" : "Payment will be verified by our team"}</p>}
        <p className="mt-2 max-w-md text-muted-foreground">We'll call or WhatsApp you shortly to confirm your delivery.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="whatsapp" size="xl">
            <a href={whatsappLink(data.clinic.whatsapp, `Assalam o Alaikum, I just placed order ${order ?? ""}.`)} target="_blank" rel="noreferrer"><WhatsAppIcon /> Message us</a>
          </Button>
          <Button asChild variant="outlinePill" size="xl"><Link to="/track" search={order ? { order } : {}}><PackageSearch /> Track order</Link></Button>
          <Button asChild variant="ghost" size="xl"><Link to="/shop">Continue shopping</Link></Button>
        </div>
      </div>
    </section>
  );
}
