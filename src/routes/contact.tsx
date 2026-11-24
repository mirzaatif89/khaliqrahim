import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { WhatsAppIcon } from "@/components/site/icons";
import { contentQuery } from "@/lib/queries";
import { whatsappLink } from "@/lib/content";
import { getVisitorId } from "@/lib/visitor";
import { supabase } from "@/lib/backend";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Location — Khaliq Rahim Medical Center, Bhara Kahu" },
      { name: "description", content: "Kiyani Road, near Athal Chowk, Bhara Kahu, Islamabad. Call or WhatsApp 0333-0501084. Open Monday to Saturday, 9 AM – 8 PM." },
      { property: "og:title", content: "Contact Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Call or WhatsApp 0333-0501084 · Kiyani Road, Bhara Kahu, Islamabad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data } = useSuspenseQuery(contentQuery);
  const c = data.clinic;
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("submit_lead", {
      p_name: form.name, p_phone: form.phone, p_email: form.email, p_message: form.message,
      p_product_id: null as unknown as string, p_source: "contact", p_visitor: getVisitorId(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  const cards = [
    { icon: Phone, t: "Call", v: c.phone, href: `tel:${c.phone}` },
    { icon: WhatsAppIcon, t: "WhatsApp", v: c.phone, href: whatsappLink(c.whatsapp, "Assalam o Alaikum") },
    { icon: Mail, t: "Email", v: c.email, href: `mailto:${c.email}` },
    { icon: Clock, t: "Timings", v: `${c.hours} · ${c.holiday}`, href: undefined },
  ];

  return (
    <>
      <section className="bg-hero">
        <div className="container-site py-16 md:py-24">
          <Reveal>
            <p className="eyebrow">Get in touch</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-medium leading-[1.02] md:text-7xl">We're here to <em className="italic text-gradient">help.</em></h1>
          </Reveal>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((x) => (
              <StaggerItem key={x.t}>
                <a href={x.href} target={x.href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group block h-full rounded-3xl bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
                  <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><x.icon className="size-5" /></span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{x.t}</p>
                  <p className="mt-1 break-words font-semibold">{x.v}</p>
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      <section className="container-site grid gap-10 py-16 md:py-24 lg:grid-cols-2">
        <Reveal from="left" className="overflow-hidden rounded-[2rem] border border-border shadow-lift">
          <iframe
            title="Clinic location map"
            src="https://www.google.com/maps?q=Khaliq+Rahim+Medical+Center+Kiyani+Road+Bhara+Kahu+Islamabad&output=embed"
            className="h-[420px] w-full lg:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
        <Reveal from="right">
          <div className="rounded-[2rem] bg-card p-8 shadow-soft md:p-10">
            <p className="flex items-start gap-3 text-lg"><MapPin className="mt-1 size-5 shrink-0 text-primary" /> {c.address}</p>
            <Button asChild variant="outlinePill" className="mt-4"><a href={c.maps_url} target="_blank" rel="noreferrer"><Navigation /> Get directions</a></Button>
            <h2 className="mt-10 text-3xl">Send us a message</h2>
            {sent ? (
              <p className="mt-6 rounded-2xl bg-secondary p-5 font-medium text-secondary-foreground">Thank you! We'll get back to you on your phone or WhatsApp soon.</p>
            ) : (
              <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
                <Input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12" />
                <Input required inputMode="tel" placeholder="Mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12" />
                <Input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 sm:col-span-2" />
                <Textarea required placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="min-h-32 sm:col-span-2" />
                <Button type="submit" variant="hero" size="xl" className="sm:col-span-2" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
              </form>
            )}
          </div>
        </Reveal>
      </section>
    </>
  );
}
