import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/backend";
import { Stars } from "./Stars";

export function ReviewForm({ productId }: { productId: string | null }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({ name: "", city: "", comment: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("submit_review", {
      p_name: form.name, p_city: form.city, p_comment: form.comment, p_rating: rating, p_product_id: productId as string,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    void qc.invalidateQueries({ queryKey: ["reviews"] });
  };
  if (done) return <p className="rounded-2xl bg-secondary p-5 font-medium text-secondary-foreground">Thank you! Your review will appear after the clinic approves it.</p>;
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <p className="font-display text-xl">Write a review</p>
      <Stars value={rating} onChange={setRating} size="size-6" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="City (optional)" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </div>
      <Textarea required minLength={5} placeholder="Share your experience" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
      <Button type="submit" variant="hero" disabled={busy}>{busy ? "Submitting…" : "Submit review"}</Button>
    </form>
  );
}
