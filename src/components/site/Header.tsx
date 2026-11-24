import { Link, useRouterState } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { CalendarHeart, Menu, Phone, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { contentQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Medicines" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/reviews", label: "Reviews" },
  { to: "/track", label: "Track order" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { data: content } = useSuspenseQuery(contentQuery);
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMobile(false), [path]);

  const announcement = content.home.announcement;

  return (
    <>
      <div className="overflow-hidden bg-forest text-forest-foreground">
        <div className="flex w-max animate-marquee gap-16 py-2 text-xs font-medium tracking-wide">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-16 whitespace-nowrap">
              <span>{announcement}</span>
              <span className="text-accent">✦</span>
              <span>{content.clinic.hours} · {content.clinic.holiday}</span>
              <span className="text-accent">✦</span>
            </span>
          ))}
        </div>
      </div>
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-500",
          scrolled ? "border-b border-border/70 bg-background/85 shadow-soft backdrop-blur-xl" : "bg-background",
        )}
      >
        <div className={cn("container-site flex items-center justify-between gap-4 transition-all duration-500", scrolled ? "h-16" : "h-20")}>
          <Logo logoUrl={content.clinic.logo_url} />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-foreground/75 transition-colors hover:text-primary data-[status=active]:text-primary"
              >
                {({ isActive }) => (
                  <>
                    {n.label}
                    {isActive && <motion.span layoutId="nav-dot" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent" />}
                  </>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href={`tel:${content.clinic.phone}`} className="hidden items-center gap-2 whitespace-nowrap text-sm 2xl:flex">
              <span className="grid size-9 place-items-center rounded-full bg-secondary text-primary">
                <Phone className="size-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.65rem] uppercase tracking-widest text-muted-foreground">Call clinic</span>
                <span className="font-bold">{content.clinic.phone}</span>
              </span>
            </a>
            <button
              onClick={() => setOpen(true)}
              className="relative grid size-11 place-items-center rounded-full border border-border bg-card transition hover:border-primary hover:text-primary"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="size-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-accent-foreground"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <Button asChild variant="hero" className="hidden h-11 px-5 sm:inline-flex lg:hidden xl:inline-flex">
              <Link to="/appointment">
                <CalendarHeart /> Book appointment
              </Link>
            </Button>
            <button
              className="grid size-11 place-items-center rounded-full border border-border bg-card lg:hidden"
              onClick={() => setMobile((m) => !m)}
              aria-label="Menu"
              aria-expanded={mobile}
            >
              {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobile && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-background lg:hidden"
              aria-label="Mobile"
            >
              <div className="container-site grid gap-1 py-4">
                {NAV.map((n, i) => (
                  <motion.div key={n.to} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <Link
                      to={n.to}
                      activeOptions={{ exact: n.to === "/" }}
                      className="block rounded-xl px-4 py-3 font-display text-2xl text-foreground data-[status=active]:bg-secondary data-[status=active]:text-primary"
                    >
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
                <Button asChild variant="hero" size="xl" className="mt-3">
                  <Link to="/appointment">
                    <CalendarHeart /> Book appointment
                  </Link>
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
