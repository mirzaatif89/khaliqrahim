import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Leaf, Search, Truck, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { ProductCard } from "@/components/site/ProductCard";
import { catalogQuery, contentQuery } from "@/lib/queries";
import { CATEGORY_ICON } from "@/lib/tones";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import shelvesImg from "@/assets/dispensary-shelves.jpg";

type ShopSearch = { category?: string; q?: string };

export const Route = createFileRoute("/shop/")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => {
    const out: ShopSearch = {};
    if (typeof s["category"] === "string" && s["category"]) out.category = s["category"];
    if (typeof s["q"] === "string" && s["q"]) out.q = s["q"];
    return out;
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "Homeopathic Medicines Online — Khaliq Rahim Medical Center" },
      { name: "description", content: "Buy genuine homeopathic medicines online: mother tinctures, dilutions, biochemic tablets, syrups, tonics, skin and hair care, delivered across Pakistan." },
      { property: "og:title", content: "Homeopathic Medicine Store — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Mother tinctures, dilutions, biochemic tablets, tonics and treatment kits — order online for delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { data } = useSuspenseQuery(catalogQuery);
  const { data: content } = useSuspenseQuery(contentQuery);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop/" });
  const [q, setQ] = useState(search.q ?? "");
  const [sort, setSort] = useState("featured");

  const active = search.category;
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const catId = data.categories.find((c) => c.slug === active)?.id;
    let items = data.products.filter((p) => (!catId || p.category_id === catId));
    if (term)
      items = items.filter((p) =>
        [p.name, p.short_description, p.description, ...(p.uses ?? [])].join(" ").toLowerCase().includes(term),
      );
    if (sort === "low") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "high") items = [...items].sort((a, b) => b.price - a.price);
    if (sort === "featured") items = [...items].sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order);
    return items;
  }, [data, active, q, sort]);

  const catName = (id: string | null) => data.categories.find((c) => c.id === id)?.name;

  return (
    <>
      <PageHero eyebrow="Medicine store" title="Genuine remedies," accent="reserved online." image={shelvesImg} alt="Shelves of homeopathic medicine bottles in the clinic dispensary">
        Browse medicines dispensed by {content.clinic.name}. Not sure what you need? Consult the doctor first — we'll guide you.
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-foreground/10 px-4 py-2"><Wallet className="size-4 text-accent" /> Cash on Delivery</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-foreground/10 px-4 py-2"><Truck className="size-4 text-accent" /> Delivery across Pakistan</span>
        </div>
      </PageHero>

      <section className="container-site py-12 md:py-16">
        <div className="sticky top-16 z-20 -mx-2 rounded-3xl border border-border/60 bg-background/85 p-3 shadow-soft backdrop-blur-xl md:top-20">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search medicines, e.g. cough, hair fall, kidney…"
                className="h-12 rounded-full border-border bg-card pl-11 text-base"
                aria-label="Search medicines"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Clear search">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-12 w-full rounded-full bg-card md:w-52" aria-label="Sort"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured first</SelectItem>
                <SelectItem value="low">Price: low to high</SelectItem>
                <SelectItem value="high">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              onClick={() => navigate({ search: (s) => ({ ...(s.q ? { q: s.q } : {}) }) })}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition", !active ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-secondary")}
            >
              All medicines
            </button>
            {data.categories.map((c) => {
              const Icon = CATEGORY_ICON[c.icon] ?? Leaf;
              return (
                <button
                  key={c.id}
                  onClick={() => navigate({ search: (s) => ({ ...(s.q ? { q: s.q } : {}), category: c.slug }) })}
                  className={cn("inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition", active === c.slug ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-secondary")}
                >
                  <Icon className="size-4" /> {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">{list.length} {list.length === 1 ? "medicine" : "medicines"}</p>
        <motion.div layout className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35 }}>
                <ProductCard product={p} categoryName={catName(p.category_id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {list.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-border p-12 text-center">
            <p className="font-display text-2xl">No medicines found</p>
            <p className="mt-2 text-muted-foreground">Try another word, or <Link to="/contact" className="font-semibold text-primary underline">ask the clinic</Link> — we stock many more remedies.</p>
          </div>
        )}
      </section>
    </>
  );
}
