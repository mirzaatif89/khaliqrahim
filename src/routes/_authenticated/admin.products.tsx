import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Card, Empty, Loading, PageTitle } from "@/components/admin/ui";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/backend";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { formatPKR } from "@/lib/pricing";
import { mediaUrl } from "@/lib/content";
import { TONE_BG, CATEGORY_ICON } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: Products });

type Product = Tables<"products">;
type Category = Tables<"categories">;

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function useCatalog() {
  return useQuery({
    queryKey: ["admin", "catalog"],
    queryFn: async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("*").order("sort_order"),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      if (p.error) throw p.error;
      if (c.error) throw c.error;
      return { products: p.data, categories: c.data };
    },
  });
}

function Products() {
  const qc = useQueryClient();
  const cat = useCatalog();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<Product> | null>(null);
  const [del, setDel] = useState<Product | null>(null);
  const invalidate = () => { void qc.invalidateQueries({ queryKey: ["admin", "catalog"] }); void qc.invalidateQueries({ queryKey: ["catalog"] }); };

  const patch = useMutation({
    mutationFn: async ({ id, p }: { id: string; p: Partial<Product> }) => {
      const { error } = await supabase.from("products").update(p).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Product deleted"); invalidate(); setDel(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (cat.data?.products ?? []).filter((p) => !t || p.name.toLowerCase().includes(t));
  }, [cat.data, q]);
  const catName = (id: string | null) => cat.data?.categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <PageTitle title="Products" subtitle="Your medicine catalog — prices, stock, photos and categories." actions={<Button variant="hero" onClick={() => setEdit({ is_active: true, stock: 100, uses: [] })}><Plus /> Add product</Button>} />
      <Tabs defaultValue="products">
        <TabsList className="rounded-full"><TabsTrigger value="products" className="rounded-full">Products</TabsTrigger><TabsTrigger value="categories" className="rounded-full">Categories</TabsTrigger></TabsList>
        <TabsContent value="products" className="mt-4">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-9" /></div>
          {cat.isLoading ? <Loading /> : list.length === 0 ? <Empty>No products yet.</Empty> : (
            <Card className="overflow-x-auto p-0 md:p-0">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visible</th><th>Featured</th><th /></tr></thead>
                <tbody className="divide-y divide-border">
                  {list.map((p) => (
                    <tr key={p.id} className={cn(!p.is_active && "opacity-60")}>
                      <td className="p-4"><div className="flex items-center gap-3"><img src={mediaUrl(p.image_url)} alt="" className="size-12 rounded-xl bg-muted object-cover" /><div><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.size}</p></div></div></td>
                      <td>{catName(p.category_id)}</td>
                      <td className="font-semibold">{formatPKR(p.price)}</td>
                      <td><span className={cn(p.stock <= 5 && "font-bold text-destructive")}>{p.stock}</span></td>
                      <td><Switch checked={p.is_active} onCheckedChange={(v) => patch.mutate({ id: p.id, p: { is_active: v } })} aria-label="Visible on website" /></td>
                      <td><Switch checked={p.is_featured} onCheckedChange={(v) => patch.mutate({ id: p.id, p: { is_featured: v } })} aria-label="Featured" /></td>
                      <td className="pr-4 text-right">
                        <Button size="icon" variant="ghost" onClick={() => setEdit(p)} aria-label="Edit"><Pencil /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDel(p)} aria-label="Delete"><Trash2 /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <Categories categories={cat.data?.categories ?? []} onChange={invalidate} />
        </TabsContent>
      </Tabs>
      {edit && <ProductDialog initial={edit} categories={cat.data?.categories ?? []} onClose={() => setEdit(null)} onSaved={() => { invalidate(); setEdit(null); }} />}
      <AlertDialog open={!!del} onOpenChange={(v) => !v && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {del?.name}?</AlertDialogTitle><AlertDialogDescription>This removes the product from the website. Past orders keep their records. To hide it temporarily, switch off "Visible" instead.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del && remove.mutate(del.id)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProductDialog({ initial, categories, onClose, onSaved }: { initial: Partial<Product>; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Partial<Product>>(initial);
  const [uses, setUses] = useState((initial.uses ?? []).join("\n"));
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.name || f.price == null) { toast.error("Name and price are required"); return; }
    setBusy(true);
    const row: TablesInsert<"products"> = {
      name: f.name, slug: f.slug || slugify(f.name), price: Number(f.price), compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null,
      category_id: f.category_id ?? null, size: f.size ?? null, short_description: f.short_description ?? null, description: f.description ?? null,
      uses: uses.split("\n").map((s) => s.trim()).filter(Boolean), dosage: f.dosage ?? null, ingredients: f.ingredients ?? null,
      image_url: f.image_url ?? null, stock: Number(f.stock ?? 0), is_active: f.is_active ?? true, is_featured: f.is_featured ?? false, sort_order: Number(f.sort_order ?? 0),
    };
    const { error } = f.id ? await supabase.from("products").update(row).eq("id", f.id) : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) { toast.error(error.message.includes("duplicate") ? "A product with this web address already exists" : error.message); return; }
    toast.success(f.id ? "Product saved" : "Product added");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle className="font-display text-2xl">{f.id ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-5 md:grid-cols-[200px_1fr]">
          <ImageUpload label="Photo" folder="products" value={f.image_url ?? ""} onChange={(v) => set("image_url", v || null)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input required value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Category</Label>
              <Select value={f.category_id ?? ""} onValueChange={(v) => set("category_id", v)}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Pack size</Label><Input value={f.size ?? ""} onChange={(e) => set("size", e.target.value)} placeholder="30 ml" className="mt-1.5" /></div>
            <div><Label>Price (Rs)</Label><Input required type="number" min={0} value={f.price ?? ""} onChange={(e) => set("price", Number(e.target.value))} className="mt-1.5" /></div>
            <div><Label>Old price (optional)</Label><Input type="number" min={0} value={f.compare_at_price ?? ""} onChange={(e) => set("compare_at_price", e.target.value ? Number(e.target.value) : null)} className="mt-1.5" /></div>
            <div><Label>Stock</Label><Input type="number" min={0} value={f.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} className="mt-1.5" /></div>
            <div><Label>Display order</Label><Input type="number" value={f.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} className="mt-1.5" /></div>
            <div className="sm:col-span-2"><Label>Short description</Label><Input value={f.short_description ?? ""} onChange={(e) => set("short_description", e.target.value)} className="mt-1.5" /></div>
            <div className="sm:col-span-2"><Label>Full description</Label><Textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} className="mt-1.5 min-h-24" /></div>
            <div className="sm:col-span-2"><Label>Used for (one per line)</Label><Textarea value={uses} onChange={(e) => setUses(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Dosage</Label><Textarea value={f.dosage ?? ""} onChange={(e) => set("dosage", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Ingredients</Label><Textarea value={f.ingredients ?? ""} onChange={(e) => set("ingredients", e.target.value)} className="mt-1.5" /></div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_active ?? true} onCheckedChange={(v) => set("is_active", v)} /> Visible on website</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_featured ?? false} onCheckedChange={(v) => set("is_featured", v)} /> Featured on home page</label>
            <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" variant="hero" disabled={busy}>{busy ? "Saving…" : "Save product"}</Button></div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Categories({ categories, onChange }: { categories: Category[]; onChange: () => void }) {
  const [rows, setRows] = useState<Record<string, Partial<Category>>>({});
  const [name, setName] = useState("");
  const save = async (c: Category) => {
    const p = rows[c.id];
    if (!p) return;
    const { error } = await supabase.from("categories").update(p).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Category saved");
    setRows((r) => { const n = { ...r }; delete n[c.id]; return n; });
    onChange();
  };
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name), sort_order: categories.length + 1 });
    if (error) { toast.error(error.message); return; }
    setName("");
    onChange();
  };
  const del = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"? Products in it will become uncategorised.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    onChange();
  };
  return (
    <div className="space-y-3">
      {categories.map((c) => {
        const r = { ...c, ...rows[c.id] };
        const Icon = CATEGORY_ICON[r.icon] ?? CATEGORY_ICON["leaf"]!;
        const upd = (p: Partial<Category>) => setRows((x) => ({ ...x, [c.id]: { ...x[c.id], ...p } }));
        return (
          <Card key={c.id} className="grid items-center gap-3 md:grid-cols-[auto_1fr_2fr_130px_130px_auto]">
            <span className={cn("grid size-11 place-items-center rounded-xl text-primary", TONE_BG[r.tone])}><Icon className="size-5" /></span>
            <Input value={r.name} onChange={(e) => upd({ name: e.target.value })} aria-label="Category name" />
            <Input value={r.description ?? ""} onChange={(e) => upd({ description: e.target.value })} placeholder="Description" aria-label="Description" />
            <Select value={r.tone} onValueChange={(v) => upd({ tone: v })}><SelectTrigger aria-label="Colour"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(TONE_BG).map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
            <Select value={r.icon} onValueChange={(v) => upd({ icon: v })}><SelectTrigger aria-label="Icon"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(CATEGORY_ICON).map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
            <div className="flex gap-1"><Button size="sm" variant="hero" disabled={!rows[c.id]} onClick={() => save(c)}>Save</Button><Button size="icon" variant="ghost" onClick={() => del(c)} aria-label="Delete"><Trash2 /></Button></div>
          </Card>
        );
      })}
      <form onSubmit={add} className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="h-11" /><Button type="submit" variant="hero" className="h-11"><Plus /> Add</Button></form>
    </div>
  );
}
