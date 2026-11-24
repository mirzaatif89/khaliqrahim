import type { ReactNode } from "react";
import { motion } from "motion/react";

export function PageHero({ eyebrow, title, accent, children, image, alt }: { eyebrow: string; title: string; accent?: string; children?: ReactNode; image: string; alt: string }) {
  return (
    <section className="relative overflow-hidden bg-forest-gradient grain">
      <div className="absolute -right-24 -top-24 size-96 animate-blob bg-primary-glow/25 blur-3xl" />
      <div className="container-site relative grid items-center gap-10 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="eyebrow mb-5 text-accent">
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-medium leading-[1.02] text-forest-foreground md:text-6xl lg:text-7xl"
          >
            {title} {accent && <em className="font-normal italic text-accent">{accent}</em>}
          </motion.h1>
          {children && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.35 }} className="mt-6 max-w-xl text-lg leading-relaxed text-forest-foreground/75">
              {children}
            </motion.div>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-3 rounded-[2.5rem] border border-accent/30" />
          <img src={image} alt={alt} className="aspect-[5/4] w-full rounded-[2rem] object-cover shadow-lift" />
        </motion.div>
      </div>
    </section>
  );
}
