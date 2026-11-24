import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/backend";

export function AdminLoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!open) { setPassword(""); setError(""); } }, [open]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) { setError(result.error.message); return; }
      onOpenChange(false);
      await navigate({ to: "/admin" });
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl p-7 sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Admin login</DialogTitle>
          <DialogDescription>Enter your staff email and password to open the admin panel.</DialogDescription>
        </DialogHeader>
        <form onSubmit={signIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-login-email">Email</Label>
            <Input id="admin-login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-login-password">Password</Label>
            <Input id="admin-login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
          </div>
          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="hero" className="h-11 w-full" disabled={busy}>
            <LogIn /> {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
