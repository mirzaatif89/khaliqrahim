import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPKR } from "@/lib/pricing";
import { mediaUrl } from "@/lib/content";
import { trackProduct } from "@/lib/visitor";
import type { CatalogProduct } from "@/lib/queries";

export function ProductCard({ product, categoryName }: { product: CatalogProduct; categoryName?: string | undefined }) {
  const { add, setOpen } = useCart();
  const off = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(100 - (product.price / product.compare_at_price) * 100)
    : 0;

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft transition-shadow duration-500 hover:shadow-lift"
    >
      <Link to="/shop/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden bg-muted">
        <img
          src={mediaUrl(product.image_url)}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">−{off}%</span>
        )}
        {product.stock <= 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">Out of stock</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {categoryName && <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary/80">{categoryName}</p>}
        <Link to="/shop/$slug" params={{ slug: product.slug }}>
          <h3 className="mt-1.5 font-display text-xl leading-tight text-foreground transition-colors group-hover:text-primary">{product.name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <p className="text-lg font-extrabold text-foreground">{formatPKR(product.price)}</p>
            <p className="text-xs text-muted-foreground">
              {product.compare_at_price ? <s className="mr-1.5">{formatPKR(product.compare_at_price)}</s> : null}
              {product.size}
            </p>
          </div>
          <button
            disabled={product.stock <= 0}
            onClick={() => {
              add({ product_id: product.id, slug: product.slug, name: product.name, price: product.price, image_url: product.image_url, size: product.size });
              trackProduct(product.id, "add_to_cart");
              toast.success(`${product.name} added to cart`, { action: { label: "View cart", onClick: () => setOpen(true) } });
            }}
            className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground transition-all duration-300 hover:rotate-90 hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
