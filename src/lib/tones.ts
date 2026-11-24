import { Droplets, FlaskConical, Flower2, Leaf, Package, Pill, Sprout, type LucideIcon } from "lucide-react";

export const TONE_BG: Record<string, string> = {
  sage: "bg-tone-sage",
  sky: "bg-tone-sky",
  sand: "bg-tone-sand",
  blush: "bg-tone-blush",
  mint: "bg-tone-mint",
  gold: "bg-tone-gold",
};

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  sprout: Sprout,
  droplets: Droplets,
  pill: Pill,
  flask: FlaskConical,
  flower: Flower2,
  package: Package,
  leaf: Leaf,
};
