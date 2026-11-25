import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingBag, Truck, Wallet } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stars } from "@/components/site/Stars";
import { ReviewForm } from "@/components/site/ReviewForm";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { WhatsAppIcon } from "@/components/site/icons";
import { catalogQuery, contentQuery, productQuery } from "@/lib/queries";
import { formatPKR } from "@/lib/pricing";
import { mediaUrl, whatsappLink } from "@/lib/content";
import { useCart } from "@/lib/cart";
import { getVisitorId, trackProduct } from "@/lib/visitor";
import { supabase } from "@/lib/backend";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ context, params }) => {
    const [res] = await Promise.all([
      context.queryClient.ensureQueryData(productQuery(params.slug)),
      context.queryClient.ensureQueryData(catalogQuery),
    ]);
    if (!res) throw notFound();
    return { name: res.product.name, short: res.product.short_description ?? "" };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Khaliq Rahim Medical Center` },
          { name: "description", content: loaderData.short },
          { property: "og:title", content: `${loaderData.name} — Khaliq Rahim Medical Center` },
          { property: "og:description", content: loaderData.short },
          { property: "og:type", content: "product" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Medicine unavailable — Khaliq Rahim Medical Center" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="container-site py-24 text-center">
      <h1 className="text-4xl">Medicine not found</h1>
      <Button asChild variant="hero" className="mt-6"><Link to="/shop">Back to store</Link></Button>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { data: content } = useSuspenseQuery(contentQuery);
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const product = data!.product;
  const reviews = data!.reviews;
  const cat = catalog.categories.find((c) => c.id === product.category_id);
  const related = catalog.products.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  useEffect(() => {
    trackProduct(product.id, "view");
  }, [product.id]);

  const addToCart = () => {
    add({ product_id: product.id, slug: product.slug, name: product.name, price: product.price, image_url: product.image_url, size: product.size }, qty);
    trackProduct(product.id, "add_to_cart");
    toast.success(`${qty} × ${product.name} added`, { action: { label: "View cart", onClick: () => setOpen(true) } });
  };

  return (
    <>
      <section className="bg-hero">
        <div className="container-site py-8 md:py-14">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" /> All medicines
          </Link>
          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative">
              <div className="absolute -inset-4 -z-0 animate-blob bg-tone-gold opacity-60 blur-2xl" />
              <img src={mediaUrl(product.image_url)} alt={product.name} className="relative aspect-square w-full rounded-[2.5rem] object-cover shadow-lift" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
              {cat && (
                <Link to="/shop" search={{ category: cat.slug }} className="eyebrow">{cat.name}</Link>
              )}
              <h1 className="mt-3 text-4xl font-medium leading-tight md:text-6xl">{product.name}</h1>
              {reviews.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Stars value={Math.round(avg)} /> {avg.toFixed(1)} · {reviews.length} reviews</div>
              )}
              <p className="mt-5 text-lg text-muted-foreground">{product.short_description}</p>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-4xl text-primary">{formatPKR(product.price)}</span>
                {product.compare_at_price ? <s className="text-lg text-muted-foreground">{formatPKR(product.compare_at_price)}</s> : null}
                {product.size && <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">{product.size}</span>}
              </div>
              {product.uses.length > 0 && (
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {product.uses.map((u) => (
                    <li key={u} className="flex items-center gap-2 text-sm font-medium"><Check className="size-4 text-success" /> {u}</li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="flex h-13 items-center rounded-full border border-border bg-card">
                  <button className="grid size-12 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="size-4" /></button>
                  <span className="w-8 text-center font-bold">{qty}</span>
                  <button className="grid size-12 place-items-center" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity"><Plus className="size-4" /></button>
                </div>
                <Button variant="hero" size="xl" className="flex-1" disabled={product.stock <= 0} onClick={addToCart}>
                  <ShoppingBag /> {product.stock <= 0 ? "Out of stock" : "Add to cart"}
                </Button>
              </div>
              <Button asChild variant="whatsapp" size="xl" className="mt-3 w-full">
                <a
                  href={whatsappLink(content.clinic.whatsapp, `Assalam o Alaikum, I want to order ${product.name} (${product.size ?? ""}) — qty ${qty}.`)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackProduct(product.id, "whatsapp")}
                >
                  <WhatsAppIcon /> Order on WhatsApp
                </a>
              </Button>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs font-semibold">
                <div className="rounded-2xl bg-card p-4 shadow-soft"><Wallet className="mx-auto mb-2 size-5 text-primary" />Cash on Delivery</div>
                <div className="rounded-2xl bg-card p-4 shadow-soft"><Truck className="mx-auto mb-2 size-5 text-primary" />Pakistan delivery</div>
                <div className="rounded-2xl bg-card p-4 shadow-soft"><ShieldCheck className="mx-auto mb-2 size-5 text-primary" />Dispensed by clinic</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container-site grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr]">
        <Tabs defaultValue="about">
          <TabsList className="h-auto flex-wrap rounded-full bg-secondary p-1.5">
            <TabsTrigger value="about" className="rounded-full px-5 py-2">About</TabsTrigger>
            <TabsTrigger value="dosage" className="rounded-full px-5 py-2">Dosage</TabsTrigger>
            <TabsTrigger value="ingredients" className="rounded-full px-5 py-2">Ingredients</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full px-5 py-2">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="about" className="mt-6 text-lg leading-relaxed text-muted-foreground">{product.description}</TabsContent>
          <TabsContent value="dosage" className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {product.dosage}
            <p className="mt-4 rounded-2xl bg-tone-sand p-4 text-sm text-foreground">Homeopathic remedies work best when chosen for your individual case. Please consult the doctor for children, pregnancy or long-term conditions.</p>
          </TabsContent>
          <TabsContent value="ingredients" className="mt-6 text-lg leading-relaxed text-muted-foreground">{product.ingredients}</TabsContent>
          <TabsContent value="reviews" className="mt-6 space-y-4">
            {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet — be the first to share your experience.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between"><p className="font-semibold">{r.name}{r.city ? <span className="font-normal text-muted-foreground"> · {r.city}</span> : null}</p><Stars value={r.rating} /></div>
                <p className="mt-2 text-muted-foreground">{r.comment}</p>
              </div>
            ))}
            <ReviewForm productId={product.id} />
          </TabsContent>
        </Tabs>
        <InquiryForm productId={product.id} productName={product.name} />
      </section>

      {related.length > 0 && (
        <section className="container-site pb-20">
          <Reveal><h2 className="text-3xl md:text-4xl">You may also <em className="italic text-gradient">need</em></h2></Reveal>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} categoryName={cat?.name} />)}
          </div>
        </section>
      )}
    </>
  );
}

function InquiryForm({ productId, productName }: { productId: string; productName: string }) {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("submit_lead", {
      p_name: form.name, p_phone: form.phone, p_email: "", p_message: form.message || `Question about ${productName}`,
      p_product_id: productId, p_source: "product_inquiry", p_visitor: getVisitorId(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
  };
  return (
    <Reveal from="right">
      <form onSubmit={submit} className="rounded-[2rem] bg-forest-gradient p-7 text-forest-foreground shadow-lift">
        <p className="eyebrow text-accent">Not sure it's right for you?</p>
        <h3 className="mt-3 text-3xl">Ask the doctor</h3>
        {done ? (
          <p className="mt-6 rounded-2xl bg-forest-foreground/10 p-5">Thank you! Our team will call or WhatsApp you shortly about {productName}.</p>
        ) : (
          <div className="mt-6 space-y-3">
            <Input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl border-forest-foreground/20 bg-forest-foreground/10 text-forest-foreground placeholder:text-forest-foreground/50" />
            <Input required inputMode="tel" placeholder="Mobile number (03xx-xxxxxxx)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 rounded-xl border-forest-foreground/20 bg-forest-foreground/10 text-forest-foreground placeholder:text-forest-foreground/50" />
            <Textarea placeholder="Your symptoms or question (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="min-h-24 rounded-xl border-forest-foreground/20 bg-forest-foreground/10 text-forest-foreground placeholder:text-forest-foreground/50" />
            <Button type="submit" variant="gold" size="xl" className="w-full" disabled={busy}>{busy ? "Sending…" : "Request a call back"}</Button>
          </div>
        )}
      </form>
    </Reveal>
  );
}

