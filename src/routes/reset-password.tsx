import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/backend";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Khaliq Rahim Medical Center" },
      { name: "description", content: "Choose a new password for your admin account." },
      { property: "og:title", content: "Set a new password" },
      { property: "og:description", content: "Reset your admin portal password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    void navigate({ to: "/admin" });
  };
  return (
    <section className="grid min-h-[70vh] place-items-center bg-hero px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-[2rem] bg-card p-8 shadow-lift">
        <h1 className="text-3xl">New password</h1>
        <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1.5 h-11" /></div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>Save password</Button>
      </form>
    </section>
  );
}
