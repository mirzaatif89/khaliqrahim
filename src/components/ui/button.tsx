import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "rounded-full bg-primary text-primary-foreground shadow-lift hover:-translate-y-0.5 hover:bg-primary/95 transition-all duration-300",
        gold: "rounded-full bg-gold-gradient text-accent-foreground shadow-glow hover:-translate-y-0.5 hover:brightness-105 transition-all duration-300",
        soft: "rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-all",
        glass: "rounded-full border border-forest-foreground/30 bg-forest-foreground/10 text-forest-foreground backdrop-blur hover:bg-forest-foreground/20 transition-all",
        whatsapp: "rounded-full bg-whatsapp text-whatsapp-foreground shadow-soft hover:-translate-y-0.5 hover:brightness-105 transition-all duration-300",
        google: "gap-2.5 rounded-full border border-google-border bg-google-surface font-medium text-google-text hover:bg-google-surface/90 [&_svg]:size-[18px]",
        outlinePill: "rounded-full border border-primary/25 bg-card/60 text-primary backdrop-blur hover:border-primary hover:bg-card transition-all",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        xl: "h-13 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
