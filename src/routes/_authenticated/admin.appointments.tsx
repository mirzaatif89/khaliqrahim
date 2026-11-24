import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, Empty, Loading, PageTitle, waLink } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/site/icons";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/backend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/appointments")({ component: Appointments });

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"];
const TYPE: Record<string, string> = { in_clinic: "In-clinic", online: "Online", follow_up: "Follow-up" };

function Appointments() {
  const qc = useQueryClient();
  const [view, setView] = useState("upcoming");
  const [q, setQ] = useState("");
  const appts = useQuery({
    queryKey: ["admin", "appointments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select("*").order("preferred_date", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Appointment updated"); void qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const today = format(new Date(), "yyyy-MM-dd");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    let l = (appts.data ?? []).filter((a) => !t || [a.ticket_number, a.patient_name, a.phone].join(" ").toLowerCase().includes(t));
    if (view === "today") l = l.filter((a) => a.preferred_date === today);
    if (view === "upcoming") l = l.filter((a) => a.preferred_date >= today).sort((a, b) => a.preferred_date.localeCompare(b.preferred_date));
    if (view === "past") l = l.filter((a) => a.preferred_date < today);
    return l;
  }, [appts.data, view, q, today]);

  return (
    <>
      <PageTitle title="Appointments" subtitle="Online registrations and ticket numbers." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search ticket, name, phone" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-9" /></div>
        <div className="flex gap-1.5">
          {["today", "upcoming", "past", "all"].map((s) => (
            <button key={s} onClick={() => setView(s)} className={cn("rounded-full px-3.5 py-2 text-sm font-semibold capitalize", view === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>{s}</button>
          ))}
        </div>
      </div>
      {appts.isLoading ? <Loading /> : list.length === 0 ? <Empty>No appointments here.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl text-primary">{a.ticket_number}</p>
                  <p className="font-semibold">{a.patient_name}{a.age ? `, ${a.age}` : ""}{a.gender ? ` · ${a.gender}` : ""}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">{TYPE[a.consultation_type]}</span>
              </div>
              <p className="mt-3 text-sm">{format(new Date(a.preferred_date + "T00:00:00"), "EEE, d MMM yyyy")} · {a.preferred_time}</p>
              <p className="text-sm text-muted-foreground">{a.phone}{a.fee ? ` · Rs ${a.fee}` : ""}</p>
              {a.complaint && <p className="mt-2 line-clamp-3 rounded-xl bg-muted p-3 text-sm">{a.complaint}</p>}
              <div className="mt-4 flex items-center gap-2">
                <Select defaultValue={a.status} onValueChange={(v) => update.mutate({ id: a.id, status: v })}>
                  <SelectTrigger className="h-9 flex-1 capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
                <a href={waLink(a.phone, `Assalam o Alaikum ${a.patient_name}, your appointment ${a.ticket_number} at Khaliq Rahim Medical Center is on ${a.preferred_date} at ${a.preferred_time}.`)} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground" aria-label="WhatsApp patient"><WhatsAppIcon className="size-4" /></a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
