import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  accent,
  children,
  align = "left",
  inverted = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  children?: ReactNode;
  align?: "left" | "center";
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && (
        <p className={cn("eyebrow mb-4 flex items-center gap-3", align === "center" && "justify-center", inverted && "text-accent")}>
          <span className="h-px w-8 bg-current opacity-60" />
          {eyebrow}
        </p>
      )}
      <h2 className={cn("text-4xl font-medium leading-[1.05] md:text-5xl lg:text-6xl", inverted ? "text-forest-foreground" : "text-foreground")}>
        {title} {accent && <em className={cn("font-normal italic", inverted ? "text-accent" : "text-gradient")}>{accent}</em>}
      </h2>
      {children && <div className={cn("mt-5 text-lg leading-relaxed", inverted ? "text-forest-foreground/75" : "text-muted-foreground")}>{children}</div>}
    </Reveal>
  );
}
