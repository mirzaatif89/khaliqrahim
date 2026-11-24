import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3, CalendarDays, ExternalLink, FileText, LayoutDashboard, LogOut, Menu, MessageSquareQuote,
  Package, PhoneIncoming, ShieldAlert, ShoppingCart, Users, X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/lib/backend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin portal — Khaliq Rahim Medical Center" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "orders" },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarDays, badge: "appointments" },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/insights", label: "Lead insights", icon: BarChart3 },
  { to: "/admin/leads", label: "Inquiries", icon: PhoneIncoming, badge: "leads" },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote, badge: "reviews" },
  { to: "/admin/content", label: "Website content", icon: FileText },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const role = useQuery({
    queryKey: ["admin", "is-admin", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      return !!data;
    },
  });
  const badges = useQuery({
    queryKey: ["admin", "badges"],
    enabled: role.data === true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const [o, a, l, r] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return { orders: o.count ?? 0, appointments: a.count ?? 0, leads: l.count ?? 0, reviews: r.count ?? 0 } as Record<string, number>;
    },
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  if (role.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-background"><div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (!role.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-hero px-4">
        <div className="max-w-md rounded-[2rem] bg-card p-10 text-center shadow-lift">
          <ShieldAlert className="mx-auto size-12 text-destructive" />
          <h1 className="mt-4 text-3xl">No admin access</h1>
          <p className="mt-3 text-muted-foreground">
            You're signed in as <strong>{user.email}</strong>, which isn't an approved clinic admin. If this should be an admin, make sure your email is confirmed and ask the clinic owner to add it.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outlinePill" asChild><Link to="/">Website</Link></Button>
            <Button variant="hero" onClick={signOut}><LogOut /> Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between p-5">
        <Logo inverted />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((n) => {
          const count = "badge" in n ? badges.data?.[n.badge] ?? 0 : 0;
          return (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n }}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
            >
              <n.icon className="size-4.5" />
              <span className="flex-1">{n.label}</span>
              {count > 0 && <span className="rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground">{count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-4 text-sm">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-primary"><ExternalLink className="size-4" /> View website</a>
        <p className="truncate text-xs text-sidebar-foreground/50">{user.email}</p>
        <button onClick={signOut} className="flex items-center gap-2 font-semibold text-sidebar-foreground/80 hover:text-sidebar-primary"><LogOut className="size-4" /> Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "block" : "hidden")}>
        <div className="absolute inset-0 bg-forest/60" onClick={() => setOpen(false)} />
        <div className="absolute inset-y-0 left-0 w-72">{sidebar}</div>
      </div>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border border-border" aria-label="Open menu"><Menu className="size-5" /></button>
          <span className="font-display text-lg">Admin portal</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
