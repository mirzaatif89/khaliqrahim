import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight, CalendarCheck, ClipboardList, FileHeart, HeartPulse, Home, MessageCircle, Package,
  Pill, Stethoscope, Ticket, UserRoundSearch, Video, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { WhatsAppIcon } from "@/components/site/icons";
import { contentQuery } from "@/lib/queries";
import { whatsappLink } from "@/lib/content";
import flatlayImg from "@/assets/botanical-flatlay.jpg";
import onlineImg from "@/assets/online-consult.jpg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Fees — Khaliq Rahim Medical Center" },
      { name: "description", content: "In-clinic and online homeopathic consultation, patient registration, individualized treatment, medicine dispensing, online medicine reservation and follow-up care. Consultation Rs 1000, follow-up Rs 500." },
      { property: "og:title", content: "Homeopathic Services & Fees — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Consultation Rs 1000 · Follow-up Rs 500 · Online consultation · Medicine delivery across Pakistan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Services,
});

const SERVICES = [
  { icon: Stethoscope, t: "In-Clinic Homeopathic Consultation", d: "Face-to-face consultation with Dr. Khaliq Rahim at our Bhara Kahu clinic." },
  { icon: UserRoundSearch, t: "Patient Assessment & Case Taking", d: "A complete review of symptoms, history, lifestyle and temperament." },
  { icon: CalendarCheck, t: "Appointment Booking", d: "Reserve your time by phone, WhatsApp or right here on the website." },
  { icon: Video, t: "Online Homeopathic Consultation", d: "Video or WhatsApp consultation for patients anywhere in Pakistan or abroad." },
  { icon: Ticket, t: "Online Registration & Tickets", d: "Register online and receive your ticket number instantly." },
  { icon: FileHeart, t: "Individualized Treatment", d: "Remedies selected for you as a person — not a one-size-fits-all formula." },
  { icon: Pill, t: "Medicine Dispensing", d: "Genuine medicines prepared and dispatched by the clinic." },
  { icon: Home, t: "Online Ordering & Delivery", d: "Order medicines online for delivery across Pakistan." },
  { icon: Wallet, t: "Cash on Delivery", d: "Pay in cash when your medicines arrive — no card needed." },
  { icon: HeartPulse, t: "Follow-Up Consultation", d: "Regular reviews so treatment is adjusted as you improve." },
  { icon: MessageCircle, t: "WhatsApp Patient Support", d: "Quick help and updates from our team on WhatsApp." },
  { icon: ClipboardList, t: "Patient Record Management", d: "Your history is kept on record for continuous, informed care." },
];

function Services() {
  const { data } = useSuspenseQuery(contentQuery);
  const c = data.clinic;
  const fees = [
    { t: "Consultation", p: `Rs ${c.fees.consultation.toLocaleString()}`, d: "First visit with full case taking", hi: true },
    { t: "Follow-up", p: `Rs ${c.fees.follow_up.toLocaleString()}`, d: "Review visit for existing patients", hi: false },
    { t: "Online consultation", p: c.fees.online, d: "Video / WhatsApp consultation", hi: false },
  ];
  return (
    <>
      <PageHero eyebrow="Our services" title="Complete care," accent="start to finish." image={flatlayImg} alt="Botanical flat-lay of herbs, flowers and homeopathic remedies">
        From the first consultation to medicines at your door — everything you need for your homeopathic treatment, in one place.
      </PageHero>

      <section className="container-site py-20 md:py-28">
        <SectionHeading eyebrow="Fees" title="Simple," accent="transparent fees" align="center" />
        <Stagger className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {fees.map((f) => (
            <StaggerItem key={f.t}>
              <div className={f.hi ? "relative h-full rounded-[2rem] bg-forest-gradient p-8 text-forest-foreground shadow-lift" : "h-full rounded-[2rem] border border-border bg-card p-8 shadow-soft"}>
                {f.hi && <span className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">Most booked</span>}
                <p className={f.hi ? "eyebrow text-accent" : "eyebrow"}>{f.t}</p>
                <p className="mt-5 font-display text-5xl">{f.p}</p>
                <p className={f.hi ? "mt-3 text-forest-foreground/70" : "mt-3 text-muted-foreground"}>{f.d}</p>
                <Button asChild variant={f.hi ? "gold" : "outlinePill"} className="mt-8 w-full" size="lg"><Link to="/appointment">Book now</Link></Button>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="bg-card py-20 md:py-28">
        <div className="container-site">
          <SectionHeading eyebrow="What we offer" title="Everything for" accent="your treatment" />
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.05}>
            {SERVICES.map((s, i) => (
              <StaggerItem key={s.t}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-background p-7 transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
                  <span className="absolute -right-3 -top-6 font-display text-8xl text-primary/[0.06] transition group-hover:text-accent/20">{String(i + 1).padStart(2, "0")}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
                    <s.icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-xl">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="container-site grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2">
        <Reveal from="left">
          <img src={onlineImg} alt="Patient on a video consultation with the homeopathic doctor" loading="lazy" className="aspect-[4/3] w-full rounded-[2.5rem] object-cover shadow-lift" />
        </Reveal>
        <div>
          <SectionHeading eyebrow="Online consultation" title="See the doctor" accent="from home.">
            Can't visit the clinic? Book an online consultation. The doctor reviews your case by video or WhatsApp call, then your medicines can be ordered online for delivery.
          </SectionHeading>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl"><a href="/appointment?type=online">Book online consultation <ArrowRight /></a></Button>
            <Button asChild variant="whatsapp" size="xl">
              <a href={whatsappLink(c.whatsapp, "Assalam o Alaikum, I would like an online consultation.")} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp</a>
            </Button>
          </Reveal>
          <Reveal delay={0.2} className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Package className="size-4 text-primary" /> Medicines can be delivered after your consultation.</Reveal>
        </div>
      </section>
    </>
  );
}
