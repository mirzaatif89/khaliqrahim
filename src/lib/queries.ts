import { queryOptions } from "@tanstack/react-query";
import { getApprovedReviews, getCatalog, getProduct, getSiteContent } from "./public.functions";

export const contentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
  staleTime: 60_000,
});

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
    staleTime: 30_000,
  });

export const reviewsQuery = queryOptions({
  queryKey: ["reviews", "approved"],
  queryFn: () => getApprovedReviews(),
  staleTime: 60_000,
});

export type Catalog = Awaited<ReturnType<typeof getCatalog>>;
export type CatalogProduct = Catalog["products"][number];
export type CatalogCategory = Catalog["categories"][number];
