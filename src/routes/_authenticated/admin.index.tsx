import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { CalendarDays, MessageSquareQuote, PhoneIncoming, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Loading, PageTitle, StatusBadge } from "@/components/admin/ui";
import { supabase } from "@/lib/backend";
import { formatPKR } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

function Dashboard() {
  const q = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const since = subDays(new Date(), 29).toISOString();
      const today = format(new Date(), "yyyy-MM-dd");
      const [orders, appts, leads, reviews, customers] = await Promise.all([
        supabase.from("orders").select("id, order_number, customer_name, city, total, status, payment_method, created_at").gte("created_at", since).order("created_at", { ascending: false }),
        supabase.from("appointments").select("id, ticket_number, patient_name, consultation_type, preferred_date, preferred_time, status").gte("preferred_date", today).order("preferred_date").limit(8),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
      ]);
      if (orders.error) throw orders.error;
      return { orders: orders.data ?? [], appts: appts.data ?? [], leads: leads.count ?? 0, reviews: reviews.count ?? 0, customers: customers.count ?? 0 };
    },
  });

  if (q.isLoading || !q.data) return <Loading />;
  const d = q.data;
  const valid = d.orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((a, o) => a + o.total, 0);
  const pending = d.orders.filter((o) => o.status === "pending").length;
  const chart = Array.from({ length: 30 }).map((_, i) => {
    const day = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
    const os = valid.filter((o) => o.created_at.slice(0, 10) === day);
    return { day: format(subDays(new Date(), 29 - i), "d MMM"), revenue: os.reduce((a, o) => a + o.total, 0), orders: os.length };
  });

  const stats = [
    { label: "Revenue (30 days)", value: formatPKR(revenue), icon: TrendingUp, to: "/admin/orders" as const },
    { label: "Pending orders", value: pending, icon: ShoppingCart, to: "/admin/orders" as const },
    { label: "Upcoming appointments", value: d.appts.length, icon: CalendarDays, to: "/admin/appointments" as const },
    { label: "Customers", value: d.customers, icon: Users, to: "/admin/customers" as const },
    { label: "New inquiries", value: d.leads, icon: PhoneIncoming, to: "/admin/leads" as const },
    { label: "Reviews to approve", value: d.reviews, icon: MessageSquareQuote, to: "/admin/reviews" as const },
  ];

  return (
    <>
      <PageTitle title="Dashboard" subtitle={format(new Date(), "EEEE, d MMMM yyyy")} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
            <s.icon className="size-5 text-primary" />
            <p className="mt-4 font-display text-3xl">{s.value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <h2 className="text-xl">Sales — last 30 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={50} />
                <Tooltip formatter={(v) => formatPKR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl">Upcoming appointments</h2>
          <ul className="mt-4 divide-y divide-border">
            {d.appts.length === 0 && <li className="py-4 text-sm text-muted-foreground">No upcoming appointments.</li>}
            {d.appts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span><span className="font-semibold">{a.patient_name}</span><br /><span className="text-muted-foreground">{a.ticket_number} · {format(new Date(a.preferred_date + "T00:00:00"), "d MMM")} {a.preferred_time}</span></span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-6">
        <div className="flex items-center justify-between"><h2 className="text-xl">Recent orders</h2><Link to="/admin/orders" className="text-sm font-semibold text-primary">View all</Link></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="py-2">Order</th><th>Customer</th><th>City</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
            <tbody className="divide-y divide-border">
              {d.orders.slice(0, 8).map((o) => (
                <tr key={o.id}><td className="py-3 font-semibold">{o.order_number}</td><td>{o.customer_name}</td><td>{o.city}</td><td className="uppercase">{o.payment_method}</td><td>{formatPKR(o.total)}</td><td><StatusBadge status={o.status} /></td></tr>
              ))}
              {d.orders.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
