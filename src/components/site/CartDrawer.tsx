import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { contentQuery } from "@/lib/queries";
import { deliveryFeeFor, formatPKR } from "@/lib/pricing";
import { mediaUrl } from "@/lib/content";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, subtotal } = useCart();
  const { data } = useSuspenseQuery(contentQuery);
  const fee = deliveryFeeFor(subtotal, data.store);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="font-display text-2xl">Your cart</SheetTitle>
        </SheetHeader>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="grid size-20 place-items-center rounded-full bg-secondary text-primary">
              <ShoppingBag className="size-9" />
            </motion.div>
            <p className="font-display text-2xl">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Browse our homeopathic medicines and add what you need.</p>
            <Button asChild variant="hero" onClick={() => setOpen(false)}>
              <Link to="/shop">Browse medicines</Link>
            </Button>
          </div>
        ) : (
          <>
                        <div className="flex-1 space-y-3 overflow-y-auto p-6">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.div
                    key={l.product_id}
                    layout
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30, height: 0 }}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-3"
                  >
                    <img src={mediaUrl(l.image_url)} alt="" className="size-20 rounded-xl object-cover" />
                    <div className="flex flex-1 flex-col">
                      <p className="font-semibold leading-tight">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.size}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-border">
                          <button className="grid size-8 place-items-center" onClick={() => setQty(l.product_id, l.quantity - 1)} aria-label="Decrease">
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{l.quantity}</span>
                          <button className="grid size-8 place-items-center" onClick={() => setQty(l.product_id, l.quantity + 1)} aria-label="Increase">
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <p className="font-bold">{formatPKR(l.price * l.quantity)}</p>
                      </div>
                    </div>
                    <button onClick={() => remove(l.product_id)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Remove">
                      <Trash2 className="size-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="space-y-2 border-t border-border p-6 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{formatPKR(subtotal)}</span></div>
                            <div className="flex justify-between border-t border-border pt-3 text-lg"><span className="font-display">Total</span><span className="font-extrabold">{formatPKR(subtotal + fee)}</span></div>
              <Button asChild variant="hero" size="xl" className="mt-3 w-full" onClick={() => setOpen(false)}>
                <Link to="/checkout">Reserve for clinic pickup</Link>
              </Button>
              <Button asChild variant="link" className="w-full" onClick={() => setOpen(false)}>
                <Link to="/cart">View full cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
