import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Card, Loading, PageTitle } from "@/components/admin/ui";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/backend";
import type { Json } from "@/integrations/supabase/types";
import { mergeContent, type SiteContent } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin/content")({ component: ContentPage });

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : undefined}><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}

function ContentPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("key, value");
      if (error) throw error;
      return mergeContent(data ?? []);
    },
  });
  const [c, setC] = useState<SiteContent | null>(null);
  useEffect(() => { if (q.data) setC(structuredClone(q.data)); }, [q.data]);

  const save = async (key: keyof SiteContent) => {
    if (!c) return;
    const { error } = await supabase.from("site_content").upsert({ key, value: c[key] as unknown as Json });
    if (error) { toast.error(error.message); return; }
    toast.success("Saved — the website is updated");
    void qc.invalidateQueries({ queryKey: ["site-content"] });
    void qc.invalidateQueries({ queryKey: ["admin", "content"] });
  };

  if (q.isLoading || !c) return <Loading />;
  const clinic = c.clinic, home = c.home, about = c.about, store = c.store;
  const upd = <K extends keyof SiteContent>(k: K, p: Partial<SiteContent[K]>) => setC((x) => (x ? { ...x, [k]: { ...x[k], ...p } } : x));
  const Save = ({ k }: { k: keyof SiteContent }) => <div className="flex justify-end sm:col-span-2"><Button variant="hero" onClick={() => save(k)}>Save changes</Button></div>;

  return (
    <>
      <PageTitle title="Website content" subtitle="Edit text, photos, contact details, fees, delivery and payment details shown on the website." />
      <Tabs defaultValue="clinic">
        <TabsList className="h-auto flex-wrap rounded-full"><TabsTrigger value="clinic" className="rounded-full">Clinic & doctor</TabsTrigger><TabsTrigger value="home" className="rounded-full">Home page</TabsTrigger><TabsTrigger value="about" className="rounded-full">About</TabsTrigger><TabsTrigger value="store" className="rounded-full">Delivery & payments</TabsTrigger><TabsTrigger value="admins" className="rounded-full">Admin access</TabsTrigger></TabsList>

        <TabsContent value="clinic" className="mt-4">
          <Card>
            <div className="grid gap-4 sm:grid-cols-3">
              <ImageUpload label="Doctor photo" folder="site" value={clinic.doctor_photo_url} onChange={(v) => upd("clinic", { doctor_photo_url: v })} />
              <ImageUpload label="Clinic logo" folder="site" value={clinic.logo_url} onChange={(v) => upd("clinic", { logo_url: v })} />
              <ImageUpload label="Certificate" folder="site" value={clinic.certificate_url} onChange={(v) => upd("clinic", { certificate_url: v })} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Clinic name"><Input value={clinic.name} onChange={(e) => upd("clinic", { name: e.target.value })} /></Field>
              <Field label="Doctor name"><Input value={clinic.doctor_name} onChange={(e) => upd("clinic", { doctor_name: e.target.value })} /></Field>
              <Field label="Doctor title"><Input value={clinic.doctor_title} onChange={(e) => upd("clinic", { doctor_title: e.target.value })} /></Field>
              <Field label="Years of experience"><Input type="number" value={clinic.experience_years} onChange={(e) => upd("clinic", { experience_years: Number(e.target.value) })} /></Field>
              <Field label="Qualifications (one per line)" wide><Textarea value={clinic.qualifications.join("\n")} onChange={(e) => upd("clinic", { qualifications: e.target.value.split("\n") })} className="min-h-32" /></Field>
              <Field label="Phone"><Input value={clinic.phone} onChange={(e) => upd("clinic", { phone: e.target.value })} /></Field>
              <Field label="WhatsApp (international, e.g. 923330501084)"><Input value={clinic.whatsapp} onChange={(e) => upd("clinic", { whatsapp: e.target.value })} /></Field>
              <Field label="Email"><Input value={clinic.email} onChange={(e) => upd("clinic", { email: e.target.value })} /></Field>
              <Field label="Google Maps link"><Input value={clinic.maps_url} onChange={(e) => upd("clinic", { maps_url: e.target.value })} /></Field>
              <Field label="Address" wide><Input value={clinic.address} onChange={(e) => upd("clinic", { address: e.target.value })} /></Field>
              <Field label="Timings"><Input value={clinic.hours} onChange={(e) => upd("clinic", { hours: e.target.value })} /></Field>
              <Field label="Holiday"><Input value={clinic.holiday} onChange={(e) => upd("clinic", { holiday: e.target.value })} /></Field>
              <Field label="Consultation fee (Rs)"><Input type="number" value={clinic.fees.consultation} onChange={(e) => upd("clinic", { fees: { ...clinic.fees, consultation: Number(e.target.value) } })} /></Field>
              <Field label="Follow-up fee (Rs)"><Input type="number" value={clinic.fees.follow_up} onChange={(e) => upd("clinic", { fees: { ...clinic.fees, follow_up: Number(e.target.value) } })} /></Field>
              <Field label="Online consultation fee (text)"><Input value={clinic.fees.online} onChange={(e) => upd("clinic", { fees: { ...clinic.fees, online: e.target.value } })} /></Field>
              <Field label="Facebook"><Input value={clinic.social.facebook} onChange={(e) => upd("clinic", { social: { ...clinic.social, facebook: e.target.value } })} /></Field>
              <Field label="Instagram"><Input value={clinic.social.instagram} onChange={(e) => upd("clinic", { social: { ...clinic.social, instagram: e.target.value } })} /></Field>
              <Field label="TikTok"><Input value={clinic.social.tiktok} onChange={(e) => upd("clinic", { social: { ...clinic.social, tiktok: e.target.value } })} /></Field>
              <Field label="YouTube"><Input value={clinic.social.youtube} onChange={(e) => upd("clinic", { social: { ...clinic.social, youtube: e.target.value } })} /></Field>
              <Save k="clinic" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="home" className="mt-4">
          <Card className="grid gap-4 sm:grid-cols-2">
            <Field label="Top announcement bar" wide><Input value={home.announcement} onChange={(e) => upd("home", { announcement: e.target.value })} /></Field>
            <Field label="Small heading above title" wide><Input value={home.hero_eyebrow} onChange={(e) => upd("home", { hero_eyebrow: e.target.value })} /></Field>
            <Field label="Main title"><Input value={home.hero_title} onChange={(e) => upd("home", { hero_title: e.target.value })} /></Field>
            <Field label="Highlighted title words"><Input value={home.hero_highlight} onChange={(e) => upd("home", { hero_highlight: e.target.value })} /></Field>
            <Field label="Intro text" wide><Textarea value={home.hero_subtitle} onChange={(e) => upd("home", { hero_subtitle: e.target.value })} /></Field>
            <Save k="home" />
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card className="grid gap-4 sm:grid-cols-2">
            <Field label="Doctor introduction" wide><Textarea value={about.doctor_intro} onChange={(e) => upd("about", { doctor_intro: e.target.value })} className="min-h-32" /></Field>
            <Field label="Mission" wide><Textarea value={about.mission} onChange={(e) => upd("about", { mission: e.target.value })} /></Field>
            <Field label="Vision" wide><Textarea value={about.vision} onChange={(e) => upd("about", { vision: e.target.value })} /></Field>
            <Save k="about" />
          </Card>
        </TabsContent>

        <TabsContent value="store" className="mt-4">
          <Card className="grid gap-4 sm:grid-cols-2">
            <Field label="Delivery charge (Rs)"><Input type="number" min={0} value={store.delivery_fee} onChange={(e) => upd("store", { delivery_fee: Number(e.target.value) })} /></Field>
            <Field label="Free delivery on orders over (Rs, 0 = never)"><Input type="number" min={0} value={store.free_delivery_over} onChange={(e) => upd("store", { free_delivery_over: Number(e.target.value) })} /></Field>
            <Field label="Delivery time text" wide><Input value={store.delivery_time} onChange={(e) => upd("store", { delivery_time: e.target.value })} /></Field>
            <p className="text-sm text-muted-foreground sm:col-span-2">Cash on Delivery is always available. Fill in any of the accounts below to also offer that payment option at checkout — your team verifies the transaction ID before dispatch. Leave blank to hide.</p>
            <Field label="JazzCash number"><Input value={store.jazzcash_number} onChange={(e) => upd("store", { jazzcash_number: e.target.value })} /></Field>
            <Field label="JazzCash account title"><Input value={store.jazzcash_title} onChange={(e) => upd("store", { jazzcash_title: e.target.value })} /></Field>
            <Field label="Easypaisa number"><Input value={store.easypaisa_number} onChange={(e) => upd("store", { easypaisa_number: e.target.value })} /></Field>
            <Field label="Easypaisa account title"><Input value={store.easypaisa_title} onChange={(e) => upd("store", { easypaisa_title: e.target.value })} /></Field>
            <Field label="Bank name"><Input value={store.bank_name} onChange={(e) => upd("store", { bank_name: e.target.value })} /></Field>
            <Field label="Account title"><Input value={store.bank_account_title} onChange={(e) => upd("store", { bank_account_title: e.target.value })} /></Field>
            <Field label="Account number"><Input value={store.bank_account_number} onChange={(e) => upd("store", { bank_account_number: e.target.value })} /></Field>
            <Field label="IBAN"><Input value={store.bank_iban} onChange={(e) => upd("store", { bank_iban: e.target.value })} /></Field>
            <Save k="store" />
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-4"><AdminEmails /></TabsContent>
      </Tabs>
    </>
  );
}

function AdminEmails() {
  const q = useQuery({
    queryKey: ["admin", "admin-emails"],
    queryFn: async () => (await supabase.from("admin_emails").select("*").order("created_at")).data ?? [],
  });
  const [email, setEmail] = useState("");
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("admin_emails").insert({ email: email.trim().toLowerCase() });
    if (error) { toast.error(error.message); return; }
    setEmail("");
    void q.refetch();
  };
  const remove = async (em: string) => {
    if ((q.data?.length ?? 0) <= 1) { toast.error("Keep at least one admin"); return; }
    if (!confirm(`Remove admin access for ${em}?`)) return;
    const { error } = await supabase.from("admin_emails").delete().eq("email", em);
    if (error) { toast.error(error.message); return; }
    void q.refetch();
  };
  return (
    <Card>
      <p className="text-sm text-muted-foreground">People with these emails get admin access after they create an account and confirm their email.</p>
      <ul className="mt-4 divide-y divide-border">
        {q.data?.map((r) => (
          <li key={r.email} className="flex items-center justify-between py-3"><span className="font-semibold">{r.email}</span><Button size="icon" variant="ghost" onClick={() => remove(r.email)} aria-label="Remove"><Trash2 /></Button></li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex gap-2"><Input type="email" required placeholder="staff@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" /><Button type="submit" variant="hero" className="h-11"><Plus /> Add admin</Button></form>
    </Card>
  );
}
