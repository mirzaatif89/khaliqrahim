import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/content";
import leafAsset from "@/assets/krmc-logo-leaf.png.asset.json";

export function LogoMark({ className }: { className?: string }) {
  return <img src={leafAsset.url} alt="" aria-hidden="true" className={cn("size-11 rounded-full bg-card object-cover", className)} />;
}

export function Logo({ logoUrl, inverted = false, className }: { logoUrl?: string; inverted?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-3", className)} aria-label="Khaliq Rahim Medical Center — Home">
      <img
        src={logoUrl ? mediaUrl(logoUrl) : leafAsset.url}
        alt=""
        className="size-12 rounded-full bg-card object-cover shadow-soft ring-2 ring-accent/50 transition-transform duration-700 group-hover:scale-110"
      />
      <span className="leading-none">
        <span className={cn("block font-display text-xl font-semibold tracking-tight", inverted ? "text-forest-foreground" : "text-foreground")}>
          Khaliq Rahim
        </span>
        <span className={cn("mt-1 block text-[0.6rem] font-bold uppercase tracking-[0.28em]", inverted ? "text-accent" : "text-primary")}>
          Medical Center · Homeopathy
        </span>
      </span>
    </Link>
  );
}
