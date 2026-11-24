import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Award, BadgeCheck, CalendarHeart, Compass, Eye, GraduationCap, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { CountUp } from "@/components/site/CountUp";
import { contentQuery } from "@/lib/queries";
import { mediaUrl } from "@/lib/content";
import clinicImg from "@/assets/clinic-room.jpg";

import doctorAsset from "@/assets/dr-khaliq-rahim.jpg.asset.json";
export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Dr. Khaliq Rahim — Homeopathic Specialist, Islamabad" },
      { name: "description", content: "Dr. Khaliq Rahim — Ph.D, Doctorate of Medicine (U.K), D.I.HOM (UK), B.H.M.S, DHMS. Homeopathic physician & consultant with 30+ years of experience at Bhara Kahu, Islamabad." },
      { property: "og:title", content: "About Dr. Khaliq Rahim — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Three decades of individualized homeopathic care in Islamabad." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  const { data } = useSuspenseQuery(contentQuery);
  const c = data.clinic;
  const a = data.about;
  return (
    <>
      <PageHero eyebrow="About the clinic" title="Three decades of" accent="gentle care." image={clinicImg} alt="Calm consultation room at Khaliq Rahim Medical Center">
        {c.name} — {c.address}. A calm, welcoming place where every patient is heard.
      </PageHero>

      <section className="container-site grid items-center gap-14 py-20 md:py-28 lg:grid-cols-[1fr_1.2fr]">
        <Reveal from="left" className="relative mx-auto w-full max-w-md">
          <img src={c.doctor_photo_url ? mediaUrl(c.doctor_photo_url) : doctorAsset.url} alt={c.doctor_name} className="aspect-[4/5] w-full rounded-t-[999px] rounded-b-[2.5rem] object-cover object-[60%_center] shadow-lift" />
          <div className="absolute -bottom-6 -right-4 rounded-3xl bg-gold-gradient px-6 py-5 text-accent-foreground shadow-glow">
            <p className="font-display text-5xl"><CountUp to={c.experience_years} suffix="+" /></p>
            <p className="text-xs font-bold uppercase tracking-wider">Years of practice</p>
          </div>
        </Reveal>
        <div>
          <SectionHeading eyebrow="Meet the doctor" title={c.doctor_name} />
          <Reveal delay={0.1}>
            <p className="mt-3 text-lg font-semibold text-primary">{c.doctor_title}</p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{a.doctor_intro}</p>
          </Reveal>
          <Stagger className="mt-10 space-y-3">
            {c.qualifications.map((q, i) => (
              <StaggerItem key={q}>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-soft transition hover:translate-x-2 hover:border-primary/30">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                    {i < 2 ? <Award className="size-5" /> : <GraduationCap className="size-5" />}
                  </span>
                  <span className="font-semibold">{q}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-site grid gap-6 md:grid-cols-2">
          {[
            { icon: Compass, title: "Our mission", text: a.mission },
            { icon: Eye, title: "Our vision", text: a.vision },
          ].map((x, i) => (
            <Reveal key={x.title} delay={i * 0.1} from={i ? "right" : "left"}>
              <div className="h-full rounded-[2rem] bg-card p-10 shadow-soft">
                <x.icon className="size-10 text-accent" />
                <h2 className="mt-6 text-4xl">{x.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{x.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {c.certificate_url && (
        <section className="container-site py-20">
          <SectionHeading eyebrow="Recognition" title="Certificates &" accent="credentials" align="center" />
          <Reveal from="zoom" className="mx-auto mt-10 max-w-3xl">
            <img src={mediaUrl(c.certificate_url)} alt="Doctor's certificate" className="w-full rounded-3xl border border-border shadow-lift" />
          </Reveal>
        </section>
      )}

      <section className="container-site py-20 md:py-24">
        <Reveal className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-forest-gradient p-10 text-forest-foreground md:flex-row md:items-center md:p-14">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-accent"><MapPin className="size-4" /> {c.address}</p>
            <h2 className="mt-3 text-4xl">Visit us {c.hours.split(",")[0]}</h2>
            <p className="mt-2 flex items-center gap-2 text-forest-foreground/70"><BadgeCheck className="size-4" /> {c.hours} · {c.holiday}</p>
          </div>
          <Button asChild variant="gold" size="xl"><Link to="/appointment"><CalendarHeart /> Book appointment</Link></Button>
        </Reveal>
      </section>
    </>
  );
}
