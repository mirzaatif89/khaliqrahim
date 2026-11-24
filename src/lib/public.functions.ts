import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Tables } from "@/integrations/supabase/types";
import { mergeContent } from "./content";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const PRODUCT_COLS =
  "id, slug, name, category_id, price, compare_at_price, size, short_description, description, uses, dosage, ingredients, image_url, stock, is_featured, sort_order";

type LocalRows = { categories: Tables<"categories">; products: Pick<Tables<"products">, "id" | "slug" | "name" | "category_id" | "price" | "compare_at_price" | "size" | "short_description" | "description" | "uses" | "dosage" | "ingredients" | "image_url" | "stock" | "is_featured" | "sort_order">; reviews: Tables<"reviews"> & { products: { name: string; slug: string } | null }; site_content: Tables<"site_content"> };
async function localRead<T extends keyof LocalRows>(table: T, columns = "*", filters: unknown[] = [], orders: unknown[] = []) {
  const { localQuery } = await import("../../scripts/local-runtime.mjs");
  return await localQuery({ table, columns, operation: "select", filters, orders }) as { data: LocalRows[T][]; error: null };
}

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  if (import.meta.env['VITE_LOCAL_RUNTIME'] === "true") {
    const result = await localRead("site_content", "key, value");
    return mergeContent(result.data ?? []);
  }
  const { data, error } = await publicClient().from("site_content").select("key, value");
  if (error) throw new Error(error.message);
  return mergeContent(data ?? []);
});

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  if (import.meta.env['VITE_LOCAL_RUNTIME'] === "true") {
    const [cats, prods] = await Promise.all([
      localRead("categories", "*", [], [["sort_order", true]]),
      localRead("products", PRODUCT_COLS, [], [["sort_order", true]]),
    ]);
    return { categories: cats.data ?? [], products: prods.data ?? [] };
  }
  const sb = publicClient();
  const [cats, prods] = await Promise.all([
    sb.from("categories").select("id, name, slug, description, tone, icon, sort_order").order("sort_order"),
    sb.from("products").select(PRODUCT_COLS).eq("is_active", true).order("sort_order"),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (prods.error) throw new Error(prods.error.message);
  return { categories: cats.data ?? [], products: prods.data ?? [] };
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    if (import.meta.env['VITE_LOCAL_RUNTIME'] === "true") {
      const result = await localRead("products", PRODUCT_COLS, [["slug", "=", data.slug]]);
      const product = result.data?.[0];
      if (!product) return null;
      const reviews = await localRead("reviews", "id, name, city, rating, comment, created_at", [["product_id", "=", product.id]], [["created_at", false]]);
      return { product, reviews: reviews.data ?? [] };
    }
    const sb = publicClient();
    const { data: product, error } = await sb
      .from("products")
      .select(PRODUCT_COLS)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;
    const { data: reviews } = await sb
      .from("reviews")
      .select("id, name, city, rating, comment, created_at")
      .eq("product_id", product.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);
    return { product, reviews: reviews ?? [] };
  });

export const getApprovedReviews = createServerFn({ method: "GET" }).handler(async () => {
  if (import.meta.env['VITE_LOCAL_RUNTIME'] === "true") {
    return (await localRead("reviews", "id, name, city, rating, comment, created_at, product_id, products(name, slug)", [], [["created_at", false]])).data ?? [];
  }
  const { data, error } = await publicClient()
    .from("reviews")
    .select("id, name, city, rating, comment, created_at, product_id, products(name, slug)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return data ?? [];
});
