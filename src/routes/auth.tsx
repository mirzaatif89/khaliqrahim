import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoMark } from "@/components/site/Logo";
import { supabase, isLocalRuntime } from "@/lib/backend";
import { lovable } from "@/integrations/lovable/index";

type S = { redirect?: string };

function safePath(p: string | undefined) {
  if (!p) return "/admin";
  try {
    const u = new URL(p, "http://x");
    const path = u.pathname + u.search;
    return path.startsWith("/") && !path.startsWith("//") ? path : "/admin";
  } catch {
    return "/admin";
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): S => (typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {}),
  head: () => ({
    meta: [
      { title: "Staff sign in — Khaliq Rahim Medical Center" },
      { name: "description", content: "Sign in to the Khaliq Rahim Medical Center admin portal." },
      { property: "og:title", content: "Staff sign in — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Admin portal sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const REDIRECT_KEY = "kr_auth_redirect";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const target = safePath(redirect);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (redirect) sessionStorage.setItem(REDIRECT_KEY, target);
    const go = () => {
      const dest = sessionStorage.getItem(REDIRECT_KEY) ?? target;
      sessionStorage.removeItem(REDIRECT_KEY);
      void navigate({ href: dest, replace: true });
    };
    void supabase.auth.getSession().then(({ data }) => { if (data.session) go(); });
    const { data } = supabase.auth.onAuthStateChange((e, session) => { if (e === "SIGNED_IN" && session) go(); });
    return () => data.subscription.unsubscribe();
  }, [navigate, redirect, target]);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };
  const signUp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) toast.success("Check your email to confirm your account, then sign in.");
  };
  const forgot = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent to your email.");
  };
  const google = async () => {
    sessionStorage.setItem(REDIRECT_KEY, target);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (r.error) toast.error(r.error.message);
  };

  return (
    <section className="grid min-h-[80vh] place-items-center bg-hero px-4 py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 shadow-lift">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-14" />
          <h1 className="mt-4 text-3xl">Admin portal</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="size-4" /> For clinic staff only</p>
        </div>
        {!isLocalRuntime && <Button type="button" onClick={google} variant="google" className="mt-8 h-11 w-full">
          <svg aria-hidden="true" className="size-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
          Continue with Google
        </Button>}
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
        <Tabs defaultValue="in">
          <TabsList className={`grid w-full ${isLocalRuntime ? "grid-cols-1" : "grid-cols-2"} rounded-full`}>
            <TabsTrigger value="in" className="rounded-full">Sign in</TabsTrigger>
            {!isLocalRuntime && <TabsTrigger value="up" className="rounded-full">Create account</TabsTrigger>}
          </TabsList>
          {(["in", "up"] as const).map((mode) => (
            <TabsContent key={mode} value={mode}>
              <form onSubmit={mode === "in" ? signIn : signUp} className="mt-4 space-y-4">
                <div><Label htmlFor={`e-${mode}`}>Email</Label><Input id={`e-${mode}`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" /></div>
                <div><Label htmlFor={`p-${mode}`}>Password</Label><Input id={`p-${mode}`} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11" /></div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
                {mode === "in" && <button type="button" onClick={forgot} className="w-full text-center text-sm text-primary hover:underline">Forgot password?</button>}
              </form>
            </TabsContent>
          ))}
        </Tabs>
        <p className="mt-6 text-center text-xs text-muted-foreground">Only approved clinic emails get admin access. <Link to="/" className="text-primary hover:underline">Back to website</Link></p>
      </div>
    </section>
  );
}
