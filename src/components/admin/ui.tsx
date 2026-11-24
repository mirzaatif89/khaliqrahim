import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-medium md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  pending: "bg-warning/25 text-warning-foreground",
  new: "bg-warning/25 text-warning-foreground",
  confirmed: "bg-tone-sky text-foreground",
  contacted: "bg-tone-sky text-foreground",
  processing: "bg-tone-sand text-foreground",
  shipped: "bg-tone-mint text-foreground",
  delivered: "bg-success/20 text-primary",
  completed: "bg-success/20 text-primary",
  converted: "bg-success/20 text-primary",
  approved: "bg-success/20 text-primary",
  paid: "bg-success/20 text-primary",
  cancelled: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
  no_show: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize", TONES[status] ?? "bg-muted text-muted-foreground")}>
      {status.replace("_", " ")}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6", className)}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">{children}</div>;
}

export function Loading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export const waLink = (phone: string, text = "") => {
  const d = phone.replace(/\D/g, "");
  const intl = d.startsWith("0") ? "92" + d.slice(1) : d;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
};
