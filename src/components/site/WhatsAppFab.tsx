import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { contentQuery } from "@/lib/queries";
import { whatsappLink } from "@/lib/content";
import { WhatsAppIcon } from "./icons";

export function WhatsAppFab() {
  const { data } = useSuspenseQuery(contentQuery);
  return (
    <motion.a
      href={whatsappLink(data.clinic.whatsapp, "Assalam o Alaikum Dr. Sahib, I would like to consult / order medicine.")}
      target="_blank"
      rel="noreferrer"
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 14 }}
      className="group fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lift"
      aria-label="Chat on WhatsApp"
    >
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-whatsapp" />
      <WhatsAppIcon className="relative size-7" />
      <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-soft group-hover:block">
        Chat with the clinic
      </span>
    </motion.a>
  );
}
