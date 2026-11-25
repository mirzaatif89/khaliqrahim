import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { contentQuery } from "@/lib/queries";
import { deliveryFeeFor, formatPKR } from "@/lib/pricing";
import { mediaUrl } from "@/lib/content";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Khaliq Rahim Medical Center" },
      { name: "description", content: "Review the homeopathic medicines in your cart before checkout for delivery." },
      { property: "og:title", content: "Your Cart — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Review your medicines before delivery checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, setQty, remove, hydrated } = useCart();
  const { data } = useSuspenseQuery(contentQuery);
  const fee = deliveryFeeFor(subtotal, data.store);

  return (
    <section className="container-site py-12 md:py-20">
      <h1 className="text-5xl font-medium md:text-6xl">Your <em className="italic text-gradient">cart</em></h1>
      {hydrated && lines.length === 0 ? (
        <div className="mt-10 rounded-[2rem] border border-dashed border-border p-16 text-center">
          <ShoppingBag className="mx-auto size-12 text-primary" />
          <p className="mt-4 font-display text-2xl">Your cart is empty</p>
          <Button asChild variant="hero" size="lg" className="mt-6"><Link to="/shop">Browse medicines</Link></Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.div key={l.product_id} layout exit={{ opacity: 0, x: -40 }} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
                  <img src={mediaUrl(l.image_url)} alt="" className="size-24 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <Link to="/shop/$slug" params={{ slug: l.slug }} className="font-display text-xl hover:text-primary">{l.name}</Link>
                    <p className="text-sm text-muted-foreground">{l.size} · {formatPKR(l.price)}</p>
                    <div className="mt-3 flex items-center rounded-full border border-border w-fit">
                      <button className="grid size-9 place-items-center" onClick={() => setQty(l.product_id, l.quantity - 1)} aria-label="Decrease"><Minus className="size-3.5" /></button>
                      <span className="w-8 text-center font-bold">{l.quantity}</span>
                      <button className="grid size-9 place-items-center" onClick={() => setQty(l.product_id, l.quantity + 1)} aria-label="Increase"><Plus className="size-3.5" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPKR(l.price * l.quantity)}</p>
                    <button onClick={() => remove(l.product_id)} className="mt-3 text-muted-foreground hover:text-destructive" aria-label="Remove"><Trash2 className="size-4" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <aside className="h-fit space-y-3 rounded-[2rem] bg-card p-7 shadow-soft lg:sticky lg:top-28">
            <h2 className="text-2xl">Summary</h2>
            <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{formatPKR(subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{fee ? formatPKR(fee) : "Free"}</span></div>
            <p className="text-sm text-muted-foreground">Delivery across Pakistan with Cash on Delivery.</p>
            {data.store.free_delivery_over > 0 && fee > 0 && (
              <p className="text-sm text-muted-foreground">Free delivery on orders over {formatPKR(data.store.free_delivery_over)}.</p>
            )}
            <div className="flex justify-between border-t border-border pt-4 text-xl"><span className="font-display">Total</span><span className="font-extrabold">{formatPKR(subtotal + fee)}</span></div>
            <Button asChild variant="hero" size="xl" className="w-full"><Link to="/checkout">Proceed to checkout <ArrowRight /></Link></Button>
          </aside>
        </div>
      )}
    </section>
  );
}
