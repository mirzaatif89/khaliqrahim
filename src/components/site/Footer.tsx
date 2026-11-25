import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { contentQuery } from "@/lib/queries";
import { Logo } from "./Logo";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from "./icons";
import { whatsappLink } from "@/lib/content";

export function Footer() {
  const { data } = useSuspenseQuery(contentQuery);
  const c = data.clinic;
  const socials = [
    { href: c.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: c.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: c.social.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: c.social.youtube, label: "YouTube", Icon: YouTubeIcon },
    { href: whatsappLink(c.whatsapp, "Assalam o Alaikum, I have a question."), label: "WhatsApp", Icon: WhatsAppIcon },
  ].filter((s) => s.href);

  return (
    <footer className="relative overflow-hidden bg-forest-gradient text-forest-foreground grain">
      <div className="pointer-events-none absolute inset-x-0 top-0 select-none overflow-hidden whitespace-nowrap font-display text-[16vw] font-semibold leading-none text-forest-foreground/[0.04]">
        Khaliq Rahim
      </div>
      <div className="container-site relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo inverted logoUrl={c.logo_url} />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-forest-foreground/70">
            Individualized homeopathic care by {c.doctor_name} — {c.experience_years}+ years of trusted practice in Islamabad. Book online and order medicines for delivery across Pakistan.
          </p>
          <p className="font-urdu mt-4 text-lg text-accent" dir="rtl" lang="ur">قدرتی علاج، مکمل صحت</p>
          <div className="mt-6 flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid size-10 place-items-center rounded-full border border-forest-foreground/20 transition hover:-translate-y-1 hover:border-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg text-accent">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-forest-foreground/75">
            <li><Link to="/shop" className="hover:text-accent">Medicines</Link></li>
            <li><Link to="/services" className="hover:text-accent">Services</Link></li>
            <li><Link to="/about" className="hover:text-accent">About the doctor</Link></li>
            <li><Link to="/reviews" className="hover:text-accent">Patient reviews</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-accent">Patients</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-forest-foreground/75">
            <li><Link to="/appointment" className="hover:text-accent">Book appointment</Link></li>
            <li><Link to="/track" className="hover:text-accent">Track your order</Link></li>
            <li><Link to="/cart" className="hover:text-accent">Your cart</Link></li>
            <li>Consultation: Rs {c.fees.consultation.toLocaleString()}</li>
            <li>Follow-up: Rs {c.fees.follow_up.toLocaleString()}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-accent">Visit us</h3>
          <ul className="mt-4 space-y-3 text-sm text-forest-foreground/75">
            <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-accent" /><a href={c.maps_url} target="_blank" rel="noreferrer" className="hover:text-accent">{c.address}</a></li>
            <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-accent" />{c.hours} · {c.holiday}</li>
            <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-accent" /><a href={`tel:${c.phone}`} className="hover:text-accent">{c.phone}</a></li>
            <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-accent" /><a href={`mailto:${c.email}`} className="break-all hover:text-accent">{c.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-forest-foreground/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-xs text-forest-foreground/55 md:flex-row">
          <p>© {new Date().getFullYear()} {c.name}. All rights reserved.</p>
          <p>Homeopathic medicines should be taken under medical guidance.</p>
        </div>
      </div>
    </footer>
  );
}
