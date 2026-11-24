import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Flame } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Empty, Loading, PageTitle, waLink } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/site/icons";
import { supabase } from "@/lib/backend";
import { mediaUrl } from "@/lib/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/insights")({ component: Insights });

function Insights() {
  const [days, setDays] = useState(30);
  const d = useQuery({
    queryKey: ["admin", "insights", days],
    queryFn: async () => {
      const [p, h] = await Promise.all([
        supabase.rpc("admin_product_insights", { p_days: days }),
        supabase.rpc("admin_hot_leads", { p_days: days }),
      ]);
      if (p.error) throw p.error;
      return { products: p.data ?? [], hot: h.data ?? [] };
    },
  });
  const top = (d.data?.products ?? []).slice(0, 8).map((p) => ({ name: p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name, Views: p.views, "Added to cart": p.carts, Bought: p.purchases }));

  return (
    <>
      <PageTitle
        title="Lead & customer insights"
        subtitle="Which products people look at, add to cart, ask about and buy — and who to follow up with."
        actions={[7, 30, 90].map((n) => (
          <button key={n} onClick={() => setDays(n)} className={cn("rounded-full px-4 py-2 text-sm font-semibold", days === n ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>{n} days</button>
        ))}
      />
      {d.isLoading ? <Loading /> : (
        <>
          <Card>
            <h2 className="text-xl">Top products by interest</h2>
            {top.length === 0 ? <p className="mt-4 text-muted-foreground">No activity yet. Insights appear as visitors browse the store.</p> : (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                    <Legend />
                    <Bar dataKey="Views" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Added to cart" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Bought" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="mt-6">
            <h2 className="flex items-center gap-2 text-xl"><Flame className="size-5 text-accent" /> Hot leads — interested but haven't bought</h2>
            <p className="mt-1 text-sm text-muted-foreground">Known customers who viewed a product several times, added it to cart, or asked about it, without ordering it yet.</p>
            {(d.data?.hot.length ?? 0) === 0 ? <div className="mt-4"><Empty>No hot leads right now.</Empty></div> : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="py-2">Customer</th><th>Product</th><th>Views</th><th>Cart / asks</th><th>Last seen</th><th /></tr></thead>
                  <tbody className="divide-y divide-border">
                    {d.data?.hot.map((h, i) => (
                      <tr key={i}>
                        <td className="py-3 font-semibold">{h.customer_name}<br /><span className="text-xs font-normal text-muted-foreground">{h.phone}</span></td>
                        <td>{h.product_name}</td><td>{h.views}</td><td>{h.carts}</td>
                        <td className="text-muted-foreground">{formatDistanceToNow(new Date(h.last_seen), { addSuffix: true })}</td>
                        <td className="text-right"><a href={waLink(h.phone, `Assalam o Alaikum ${h.customer_name}, this is Khaliq Rahim Medical Center. We noticed you were interested in ${h.product_name} — can we help you with your order?`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-3 py-1.5 text-xs font-bold text-whatsapp-foreground"><WhatsAppIcon className="size-3.5" /> Follow up</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="mt-6 overflow-x-auto">
            <h2 className="text-xl">All products</h2>
            <table className="mt-4 w-full min-w-[700px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="py-2">Product</th><th>Views</th><th>Cart</th><th>WhatsApp</th><th>Inquiries</th><th>Bought</th><th>View → buy</th></tr></thead>
              <tbody className="divide-y divide-border">
                {d.data?.products.map((p) => (
                  <tr key={p.product_id}>
                    <td className="py-3"><div className="flex items-center gap-3"><img src={mediaUrl(p.image_url)} alt="" className="size-9 rounded-lg object-cover" /> <span className="font-semibold">{p.name}</span></div></td>
                    <td>{p.views}</td><td>{p.carts}</td><td>{p.whatsapp}</td><td>{p.inquiries}</td><td>{p.purchases}</td>
                    <td>{p.views ? `${Math.round((p.purchases / p.views) * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
