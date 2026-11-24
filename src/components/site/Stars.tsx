import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, size = "size-4", onChange }: { value: number; size?: string; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          className={cn("transition-transform", onChange && "cursor-pointer hover:scale-125")}
          aria-label={onChange ? `${i} star${i > 1 ? "s" : ""}` : undefined}
        >
          <Star className={cn(size, i <= value ? "fill-accent text-accent" : "text-border")} />
        </button>
      ))}
    </div>
  );
}
