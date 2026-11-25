import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { addDays, format, startOfToday } from "date-fns";
import { CalendarHeart, CheckCircle2, Clock, MapPin, Printer, Stethoscope, Video, RefreshCw } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reveal } from "@/components/site/Reveal";
import { WhatsAppIcon } from "@/components/site/icons";
import { contentQuery } from "@/lib/queries";
import { CLINIC_SLOTS, isClinicDay, isValidPkMobile } from "@/lib/pricing";
import { whatsappLink } from "@/lib/content";
import { getVisitorId } from "@/lib/visitor";
import { supabase } from "@/lib/backend";
import { cn } from "@/lib/utils";
import receptionImg from "@/assets/reception-desk.jpg";

type AppointmentSearch = {
  doctor?: "khaliq-rahim" | "ghulam-shabber-awan";
  type?: "in_clinic" | "online" | "follow_up";
};
type DoctorId = NonNullable<AppointmentSearch["doctor"]>;

export const Route = createFileRoute("/appointment")({
  validateSearch: (search: Record<string, unknown>): AppointmentSearch => ({
    doctor: search.doctor === "ghulam-shabber-awan" ? "ghulam-shabber-awan" : "khaliq-rahim",
    type: ["in_clinic", "online", "follow_up"].includes(String(search.type))
      ? String(search.type) as AppointmentSearch["type"]
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book an Appointment — Khaliq Rahim Medical Center" },
      { name: "description", content: "Book an in-clinic, online or follow-up homeopathic consultation with Dr. Khaliq Rahim and get your ticket number instantly. Monday to Saturday, 9 AM – 8 PM." },
      { property: "og:title", content: "Book an Appointment with Dr. Khaliq Rahim" },
      { property: "og:description", content: "Online patient registration and instant ticket number. In-clinic Rs 1000 · Follow-up Rs 500." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Appointment,
});

type Ticket = { ticket_number: string; fee: number | null; date: string; time: string; type: string; name: string };

const TYPE_LABEL: Record<string, string> = { in_clinic: "In-clinic consultation", online: "Online consultation", follow_up: "Follow-up visit" };

function Appointment() {
  const { data } = useSuspenseQuery(contentQuery);
  const c = data.clinic;
  const search = Route.useSearch();
  const [type, setType] = useState(search.type ?? "in_clinic");
  const [doctor, setDoctor] = useState<DoctorId>(search.doctor ?? "khaliq-rahim");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", age: "", gender: "", complaint: "" });
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const types = [
    { v: "in_clinic", icon: Stethoscope, label: "In-clinic", fee: `Rs ${c.fees.consultation.toLocaleString()}` },
    { v: "online", icon: Video, label: "Online", fee: c.fees.online },
    { v: "follow_up", icon: RefreshCw, label: "Follow-up", fee: `Rs ${c.fees.follow_up.toLocaleString()}` },
  ];
  const doctors: { id: DoctorId; name: string; title: string; qualifications: string[] }[] = [
    { id: "khaliq-rahim", name: c.doctor_name, title: c.doctor_title, qualifications: c.qualifications },
    { id: "ghulam-shabber-awan", name: c.second_doctor.name, title: c.second_doctor.title, qualifications: c.second_doctor.qualifications },
  ];
  const selectedDoctor = doctors.find((item) => item.id === doctor) ?? doctors[0];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) { toast.error("Please choose a date"); return; }
    if (!time) { toast.error("Please choose a time"); return; }
    if (!isValidPkMobile(form.phone)) { toast.error("Please enter a valid mobile number, e.g. 0333-0501084"); return; }
    setBusy(true);
    const { data: res, error } = await supabase.rpc("book_appointment", {
      p_name: form.name, p_phone: form.phone, p_email: form.email, p_age: form.age ? Number(form.age) : (null as unknown as number),
      p_gender: form.gender, p_type: type, p_date: format(date, "yyyy-MM-dd"), p_time: time,
      p_complaint: `Requested doctor: ${selectedDoctor.name}${form.complaint.trim() ? `\n\n${form.complaint.trim()}` : ""}`,
      p_visitor: getVisitorId(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setTicket(res as unknown as Ticket);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="pointer-events-none absolute -right-20 top-10 size-96 animate-blob bg-tone-gold blur-3xl" />
      <div className="container-site relative grid gap-10 py-12 md:py-20 lg:grid-cols-[1fr_1.35fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="eyebrow">Online registration</p>
            <h1 className="mt-4 text-5xl font-medium leading-[1.02] md:text-6xl">Book your <em className="italic text-gradient">appointment</em></h1>
            <p className="mt-5 text-lg text-muted-foreground">Fill in the form and get your ticket number instantly. Our reception will confirm your time on WhatsApp.</p>
          </Reveal>
          <Reveal delay={0.1} className="relative mt-8 hidden lg:block">
            <img src={receptionImg} alt="Reception desk at the clinic" className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-lift" />
          </Reveal>
          <Reveal delay={0.2} className="mt-6 space-y-3 text-sm">
            <p className="flex items-center gap-3"><Clock className="size-4 text-primary" /> {c.hours} · {c.holiday}</p>
            <p className="flex items-center gap-3"><MapPin className="size-4 text-primary" /> {c.address}</p>
            <p className="flex items-center gap-3"><WhatsAppIcon className="size-4 text-primary" /> Prefer WhatsApp? <a className="font-semibold text-primary underline" href={whatsappLink(c.whatsapp, "Assalam o Alaikum, I want to book an appointment.")} target="_blank" rel="noreferrer">{c.phone}</a></p>
          </Reveal>
        </div>

        <AnimatePresence mode="wait">
          {ticket ? (
            <motion.div key="ticket" initial={{ opacity: 0, scale: 0.9, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 160, damping: 16 }}>
              <div className="overflow-hidden rounded-[2rem] bg-card shadow-lift print:shadow-none">
                <div className="bg-forest-gradient p-8 text-forest-foreground grain">
                  <CheckCircle2 className="size-12 text-accent" />
                  <p className="mt-4 text-sm uppercase tracking-[0.25em] text-forest-foreground/70">Appointment registered</p>
                  <p className="mt-2 font-display text-6xl tracking-tight text-accent">{ticket.ticket_number}</p>
                  <p className="mt-2 text-forest-foreground/75">Please keep this ticket number. Show it at reception.</p>
                </div>
                <div className="relative border-t-2 border-dashed border-border p-8">
                  <span className="absolute -left-4 -top-4 size-8 rounded-full bg-background" />
                  <span className="absolute -right-4 -top-4 size-8 rounded-full bg-background" />
                  <dl className="grid grid-cols-2 gap-6 text-sm">
                    <div><dt className="text-muted-foreground">Patient</dt><dd className="mt-1 text-lg font-semibold">{ticket.name}</dd></div>
                    <div><dt className="text-muted-foreground">Type</dt><dd className="mt-1 text-lg font-semibold">{TYPE_LABEL[ticket.type]}</dd></div>
                    <div className="col-span-2"><dt className="text-muted-foreground">Requested doctor</dt><dd className="mt-1 text-lg font-semibold">{selectedDoctor.name}</dd></div>
                    <div><dt className="text-muted-foreground">Date</dt><dd className="mt-1 text-lg font-semibold">{format(new Date(ticket.date + "T00:00:00"), "EEE, d MMM yyyy")}</dd></div>
                    <div><dt className="text-muted-foreground">Preferred time</dt><dd className="mt-1 text-lg font-semibold">{ticket.time}</dd></div>
                    <div className="col-span-2"><dt className="text-muted-foreground">Fee</dt><dd className="mt-1 text-lg font-semibold">{ticket.fee ? `Rs ${ticket.fee.toLocaleString()}` : c.fees.online}</dd></div>
                  </dl>
                  <div className="mt-8 flex flex-wrap gap-3 print:hidden">
                    <Button asChild variant="whatsapp" size="lg">
                      <a href={whatsappLink(c.whatsapp, `Assalam o Alaikum, my appointment ticket is ${ticket.ticket_number} for ${ticket.date} at ${ticket.time}. Please confirm.`)} target="_blank" rel="noreferrer"><WhatsAppIcon /> Confirm on WhatsApp</a>
                    </Button>
                    <Button variant="outlinePill" size="lg" onClick={() => window.print()}><Printer /> Print ticket</Button>
                    <Button variant="ghost" size="lg" onClick={() => { setTicket(null); setTime(""); setDate(undefined); }}>Book another</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 rounded-[2rem] border border-border/70 bg-card p-6 shadow-lift md:p-10">
              <div>
                <Label className="text-base font-bold">1. Choose your doctor</Label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {doctors.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setDoctor(item.id)}
                      className={cn("rounded-2xl border-2 p-4 text-left transition-all", doctor === item.id ? "border-primary bg-secondary shadow-soft" : "border-border hover:border-primary/40")}
                      aria-pressed={doctor === item.id}
                    >
                      <p className="font-bold">{item.name}</p>
                      <p className="mt-1 text-sm text-primary">{item.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{item.qualifications.join(" · ")}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-bold">2. Consultation type</Label>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {types.map((t) => (
                    <button
                      type="button"
                      key={t.v}
                      onClick={() => setType(t.v)}
                      className={cn("rounded-2xl border-2 p-4 text-left transition-all", type === t.v ? "border-primary bg-secondary shadow-soft" : "border-border hover:border-primary/40")}
                      aria-pressed={type === t.v}
                    >
                      <t.icon className={cn("size-6", type === t.v ? "text-primary" : "text-muted-foreground")} />
                      <p className="mt-3 font-bold">{t.label}</p>
                      <p className="text-sm text-muted-foreground">{t.fee}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-bold">3. Date & time</Label>
                <div className="mt-3 grid gap-5 md:grid-cols-[auto_1fr]">
                  <div className="rounded-2xl border border-border p-2">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < startOfToday() || d > addDays(startOfToday(), 60) || !isClinicDay(d)}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{date ? format(date, "EEEE, d MMMM") : "Choose a date (Sundays closed)"}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {CLINIC_SLOTS.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setTime(s)}
                          className={cn("rounded-xl border px-2 py-2.5 text-sm font-semibold transition", time === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50")}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-bold">4. Patient details</Label>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Input required placeholder="Patient full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12" /></div>
                  <Input required inputMode="tel" placeholder="Mobile / WhatsApp (03xx-xxxxxxx)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12" />
                  <Input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12" />
                  <Input type="number" min={0} max={120} placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="h-12" />
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger className="h-12" aria-label="Gender"><SelectValue placeholder="Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="sm:col-span-2"><Textarea placeholder="Main complaint / symptoms (optional)" value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} className="min-h-28" /></div>
                </div>
              </div>

              <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>
                <CalendarHeart /> {busy ? "Booking…" : "Get my ticket number"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
