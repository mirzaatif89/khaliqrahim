import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  ArrowRight, BadgeCheck, CalendarHeart, ClipboardList, HeartPulse, Leaf, MessageCircle,
  ShieldCheck, Sparkles, Stethoscope, Truck, Video, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ProductCard } from "@/components/site/ProductCard";
import { CountUp } from "@/components/site/CountUp";
import { Stars } from "@/components/site/Stars";
import { WhatsAppIcon } from "@/components/site/icons";
import { catalogQuery, contentQuery, reviewsQuery } from "@/lib/queries";
import { whatsappLink } from "@/lib/content";
import { CATEGORY_ICON, TONE_BG } from "@/lib/tones";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-remedies.jpg";
import caseImg from "@/assets/case-taking.jpg";
import herbsImg from "@/assets/herbs-mortar.jpg";
import deliveryImg from "@/assets/home-delivery.jpg";
import globulesImg from "@/assets/globules-macro.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(catalogQuery),
      context.queryClient.ensureQueryData(reviewsQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Khaliq Rahim Medical Center — Homeopathic Doctor & Medicines, Islamabad" },
      { name: "description", content: "Dr. Khaliq Rahim, homeopathic specialist with 30+ years of experience in Bhara Kahu, Islamabad. Book in-clinic or online consultations and reserve medicines online for clinic pickup." },
      { property: "og:title", content: "Khaliq Rahim Medical Center — Gentle homeopathic healing" },
      { property: "og:description", content: "Individualized homeopathic treatment, online consultation and medicines reserved online for clinic pickup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const services = [
  { icon: Stethoscope, title: "In-clinic consultation", text: "Detailed case-taking and assessment with the doctor at our Bhara Kahu clinic." },
  { icon: Video, title: "Online consultation", text: "Consult from anywhere in Pakistan or abroad by video or WhatsApp call." },
  { icon: ClipboardList, title: "Online registration & tickets", text: "Register online and receive your appointment ticket number instantly." },
  { icon: Truck, title: "Reserve & pick up", text: "Reserve medicines online and collect them from the clinic — pay at pickup." },
  { icon: HeartPulse, title: "Follow-up care", text: "Regular follow-ups so your treatment is adjusted as you improve." },
  { icon: MessageCircle, title: "WhatsApp support", text: "Quick answers and updates from our team on WhatsApp." },
];

function Home() {
  const { data: content } = useSuspenseQuery(contentQuery);
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { data: reviews } = useSuspenseQuery(reviewsQuery);
  const c = content.clinic;
  const h = content.home;
  const featured = catalog.products.filter((p) => p.is_featured).slice(0, 8);
  const catName = (id: string | null) => catalog.categories.find((x) => x.id === id)?.name;

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const words = h.hero_highlight.split(" ");

  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden bg-hero">
        <div className="pointer-events-none absolute -left-32 top-20 size-[28rem] animate-blob bg-secondary blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 size-80 animate-blob bg-tone-gold blur-3xl [animation-delay:-6s]" />
        <div className="container-site relative grid items-center gap-12 pb-20 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary backdrop-blur"
            >
              <Sparkles className="size-3.5 text-accent" /> {h.hero_eyebrow}
            </motion.p>
            <h1 className="mt-7 text-5xl font-medium leading-[0.98] text-foreground sm:text-6xl lg:text-[5.4rem]">
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                {h.hero_title}
              </motion.span>
              <span className="block">
                {words.map((w, i) => (
                  <motion.em
                    key={i}
                    className="mr-[0.22em] inline-block font-normal italic text-gradient"
                    initial={{ opacity: 0, y: 50, rotate: 6 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.9, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {w}
                  </motion.em>
                ))}
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              {h.hero_subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Button asChild variant="hero" size="xl">
                <Link to="/appointment"><CalendarHeart /> Book appointment</Link>
              </Button>
              <Button asChild variant="outlinePill" size="xl">
                <Link to="/shop">Shop medicines <ArrowRight /></Link>
              </Button>
            </motion.div>
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-foreground/80"
            >
              <li className="flex items-center gap-2"><BadgeCheck className="size-5 text-primary" /> {c.experience_years}+ years experience</li>
              <li className="flex items-center gap-2"><Wallet className="size-5 text-primary" /> Pay at clinic</li>
              <li className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> UK & Pakistan qualified</li>
            </motion.ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] shadow-lift"
            >
              <motion.img style={{ y: imgY, scale: imgScale }} src={heroImg} alt="Homeopathic remedies in amber bottles with fresh herbs" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/50 via-transparent to-transparent" />
            </motion.div>
            {/* rotating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
              className="absolute -left-4 top-10 grid size-32 place-items-center rounded-full bg-forest text-forest-foreground shadow-lift sm:-left-10 sm:size-36"
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-spin-slow">
                <defs><path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
                <text className="fill-accent text-[9.5px] font-bold uppercase tracking-[0.3em]">
                  <textPath href="#circ">Natural · Gentle · Trusted · Healing ·</textPath>
                </text>
              </svg>
              <span className="text-center font-display leading-none">
                <span className="block text-4xl">{c.experience_years}+</span>
                <span className="text-[0.6rem] uppercase tracking-widest text-forest-foreground/70">years</span>
              </span>
            </motion.div>
            {/* floating cards */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="absolute -right-2 top-1/3 animate-float rounded-2xl border border-border/70 bg-card/90 p-4 shadow-lift backdrop-blur sm:-right-8"
            >
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Truck className="size-4" /> Order online</p>
              <p className="mt-1 font-display text-lg">Pick up at clinic</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.8 }}
              className="absolute -bottom-6 left-6 animate-float-slow rounded-2xl border border-border/70 bg-card/95 p-4 shadow-lift backdrop-blur"
            >
              <p className="text-xs font-semibold text-muted-foreground">Open {c.hours.replace(",", " ·")}</p>
              <p className="mt-1 flex items-center gap-2 font-display text-lg">
                <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex size-2.5 rounded-full bg-success" /></span>
                Consultation Rs {c.fees.consultation.toLocaleString()}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="overflow-hidden border-y border-forest bg-forest py-5 text-forest-foreground">
        <div className="flex w-max animate-marquee items-center gap-10 font-display text-2xl italic md:text-3xl">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Individualized treatment", "Mother tinctures", "Online consultation", "Biochemic tablets", "Clinic pickup", "Follow-up care", "Skin & hair", "Women's health"].map((t, i) => (
              <span key={`${k}-${i}`} className="flex items-center gap-10 whitespace-nowrap">
                {t} <Leaf className="size-5 text-accent" />
              </span>
            )),
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-site py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Medicine store" title="Remedies for" accent="every need.">
            Genuine homeopathic medicines, carefully dispensed by the clinic — reserve online and collect in person.
          </SectionHeading>
          <Reveal from="right">
            <Button asChild variant="outlinePill" size="lg"><Link to="/shop">View all medicines <ArrowRight /></Link></Button>
          </Reveal>
        </div>
        <Stagger className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {catalog.categories.map((cat) => {
            const Icon = CATEGORY_ICON[cat.icon] ?? Leaf;
            return (
              <StaggerItem key={cat.id}>
                <Link
                  to="/shop"
                  search={{ category: cat.slug }}
                  className={cn("group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-lift", TONE_BG[cat.tone] ?? "bg-secondary")}
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-card/70 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                    <Icon className="size-6" />
                  </span>
                  <span className="mt-10 block">
                    <span className="block font-display text-xl leading-tight">{cat.name}</span>
                    <span className="mt-1 block text-xs text-foreground/60">
                      {catalog.products.filter((p) => p.category_id === cat.id).length} products
                    </span>
                  </span>
                  <ArrowRight className="absolute right-5 top-5 size-5 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* DOCTOR */}
      <section className="relative overflow-hidden bg-card py-20 md:py-28">
        <div className="container-site grid items-center gap-14 lg:grid-cols-2">
          <Reveal from="left" className="relative">
            <div className="absolute -left-6 -top-6 size-40 rounded-full bg-tone-gold blur-2xl" />
            <img src={caseImg} alt="Homeopathic doctor taking a detailed patient case" loading="lazy" className="relative aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-lift" />
            <div className="absolute -bottom-8 right-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-border shadow-lift sm:right-8">
              <div className="bg-card px-6 py-5 text-center">
                <p className="font-display text-4xl text-primary"><CountUp to={c.experience_years} suffix="+" /></p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Years</p>
              </div>
              <div className="bg-card px-6 py-5 text-center">
                <p className="font-display text-4xl text-primary"><CountUp to={6} /></p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Degrees</p>
              </div>
            </div>
          </Reveal>
          <div>
            <SectionHeading eyebrow="Meet the doctor" title={c.doctor_name} accent="" />
            <Reveal delay={0.1}>
              <p className="mt-2 font-semibold text-primary">{c.doctor_title}</p>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{content.about.doctor_intro}</p>
            </Reveal>
            <Stagger className="mt-8 flex flex-wrap gap-2">
              {c.qualifications.map((q) => (
                <StaggerItem key={q}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-secondary/60 px-4 py-2 text-sm font-semibold text-secondary-foreground">
                    <BadgeCheck className="size-4 text-primary" /> {q}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.2} className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg"><Link to="/about">About the doctor <ArrowRight /></Link></Button>
              <Button asChild variant="whatsapp" size="lg">
                <a href={whatsappLink(c.whatsapp, "Assalam o Alaikum, I would like to book a consultation.")} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp the clinic</a>
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-site py-20 md:py-28">
        <SectionHeading eyebrow="Most trusted" title="Patient" accent="favourites" align="center">
          Remedies our patients reorder most — dispensed fresh from the clinic.
        </SectionHeading>
        <Stagger className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <StaggerItem key={p.id}><ProductCard product={p} categoryName={catName(p.category_id)} /></StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* SERVICES + WHY */}
      <section className="relative overflow-hidden bg-forest-gradient py-20 text-forest-foreground grain md:py-28">
        <div className="container-site relative grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading eyebrow="Why homeopathy" title="Treating the person," accent="not just the symptom." inverted>
              Every remedy is chosen after listening to your complete story — your symptoms, habits, emotions and history. Gentle, individualized care that works with your body.
            </SectionHeading>
            <Reveal delay={0.15} className="relative mt-10">
              <img src={herbsImg} alt="Herbs being prepared in a stone mortar" loading="lazy" className="aspect-[16/11] w-full rounded-[2rem] object-cover" />
              <div className="absolute -bottom-5 -right-3 rounded-2xl bg-gold-gradient px-5 py-4 text-accent-foreground shadow-glow">
                <p className="font-display text-2xl">Rs {c.fees.consultation.toLocaleString()}</p>
                <p className="text-xs font-bold uppercase tracking-wider">Consultation · Follow-up Rs {c.fees.follow_up}</p>
              </div>
            </Reveal>
          </div>
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <StaggerItem key={s.title}>
                <div className="group h-full rounded-3xl border border-forest-foreground/10 bg-forest-foreground/[0.04] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-accent/50 hover:bg-forest-foreground/[0.08]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <s.icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-xl">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-forest-foreground/70">{s.text}</p>
                </div>
              </StaggerItem>
            ))}
            <StaggerItem className="sm:col-span-2">
              <Button asChild variant="gold" size="xl" className="w-full"><Link to="/services">See all services & fees <ArrowRight /></Link></Button>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-site grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Order in minutes" title="Reserve online," accent="collect at the clinic." />
          <div className="relative mt-10 space-y-8 before:absolute before:left-6 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-border">
            {[
              { n: "01", t: "Choose or consult", d: "Pick medicines from our store, or consult the doctor first for a personalised prescription." },
              { n: "02", t: "Place your order", d: "Reserve in a minute — no card or online payment needed." },
              { n: "03", t: "We confirm on WhatsApp", d: `Our team confirms your order on ${c.phone} and dispatches it.` },
              { n: "04", t: "Collect & pay at clinic", d: `${c.address} · ${c.hours}` },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1} className="relative flex gap-6">
                <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-primary font-display text-primary-foreground shadow-soft">{s.n}</span>
                <div>
                  <h3 className="text-2xl">{s.t}</h3>
                  <p className="mt-1 text-muted-foreground">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal from="zoom" className="relative">
          <img src={deliveryImg} alt="A parcel of homeopathic medicines packed and ready" loading="lazy" className="aspect-square w-full rounded-[2.5rem] object-cover shadow-lift" />
          <div className="absolute left-6 top-6 rounded-full bg-card/90 px-5 py-2.5 text-sm font-bold text-primary shadow-soft backdrop-blur">
            Ready for pickup
          </div>
        </Reveal>
      </section>

      {/* REVIEWS */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-site">
          <SectionHeading eyebrow="Patient stories" title="Words from" accent="our patients" align="center" />
          {reviews.length > 0 ? (
            <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
              {reviews.slice(0, 6).map((r) => (
                <StaggerItem key={r.id}>
                  <figure className="flex h-full flex-col rounded-3xl bg-card p-7 shadow-soft">
                    <Stars value={r.rating} />
                    <blockquote className="mt-4 flex-1 font-display text-lg leading-snug">“{r.comment}”</blockquote>
                    <figcaption className="mt-6 text-sm font-semibold">{r.name}{r.city ? <span className="font-normal text-muted-foreground"> · {r.city}</span> : null}</figcaption>
                  </figure>
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <Reveal className="mx-auto mt-10 max-w-xl text-center text-muted-foreground">
              Have you been treated at our clinic? Share your experience to help other families.
            </Reveal>
          )}
          <Reveal className="mt-10 text-center">
            <Button asChild variant="outlinePill" size="lg"><Link to="/reviews">Read & write reviews <ArrowRight /></Link></Button>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="container-site py-20 md:py-28">
        <Reveal from="zoom" className="relative overflow-hidden rounded-[2.5rem] shadow-lift">
          <img src={globulesImg} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/85 to-forest/30" />
          <div className="relative max-w-2xl p-10 md:p-16">
            <p className="eyebrow text-accent">Start feeling better</p>
            <h2 className="mt-4 text-4xl text-forest-foreground md:text-6xl">Book your consultation <em className="italic text-accent">today.</em></h2>
            <p className="mt-5 text-lg text-forest-foreground/75">{c.hours} · {c.holiday}. Walk-ins welcome — or reserve your time online and get a ticket number instantly.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="xl"><Link to="/appointment"><CalendarHeart /> Book appointment</Link></Button>
              <Button asChild variant="glass" size="xl"><a href={`tel:${c.phone}`}>Call {c.phone}</a></Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
