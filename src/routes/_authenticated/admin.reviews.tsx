import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Empty, Loading, PageTitle, StatusBadge } from "@/components/admin/ui";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/backend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/reviews")({ component: Reviews });

function Reviews() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const d = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*, products(name)").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const done = () => { void qc.invalidateQueries({ queryKey: ["admin"] }); void qc.invalidateQueries({ queryKey: ["reviews"] }); void qc.invalidateQueries({ queryKey: ["product"] }); };
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Review updated"); done(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  const list = (d.data ?? []).filter((r) => filter === "all" || r.status === filter);
  return (
    <>
      <PageTitle title="Reviews" subtitle="Approve patient reviews before they appear on the website."
        actions={["pending", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full px-3.5 py-2 text-sm font-semibold capitalize", filter === s ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>{s}</button>
        ))}
      />
      {d.isLoading ? <Loading /> : list.length === 0 ? <Empty>No reviews here.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between"><div><p className="font-semibold">{r.name}{r.city ? <span className="font-normal text-muted-foreground"> · {r.city}</span> : null}</p><p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "d MMM yyyy")}{r.products ? ` · ${r.products.name}` : " · Clinic review"}</p></div><StatusBadge status={r.status} /></div>
              <div className="mt-3"><Stars value={r.rating} /></div>
              <p className="mt-2 text-sm">{r.comment}</p>
              <div className="mt-4 flex gap-2">
                {r.status !== "approved" && <Button size="sm" variant="hero" onClick={() => setStatus.mutate({ id: r.id, status: "approved" })}><Check /> Approve</Button>}
                {r.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })}><X /> Reject</Button>}
                <Button size="icon" variant="ghost" className="ml-auto" onClick={() => remove.mutate(r.id)} aria-label="Delete"><Trash2 /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
