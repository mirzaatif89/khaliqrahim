import { supabase } from "@/lib/backend";

const KEY = "kr_visitor_id";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let v = window.localStorage.getItem(KEY);
  if (!v) {
    v = crypto.randomUUID();
    window.localStorage.setItem(KEY, v);
  }
  return v;
}

export function trackProduct(productId: string, event: "view" | "add_to_cart" | "whatsapp") {
  const visitor = getVisitorId();
  if (!visitor) return;
  // The request only runs once awaited/then-ed.
  void supabase.rpc("track_product_event", { p_visitor: visitor, p_product_id: productId, p_event: event }).then(() => undefined);
}
