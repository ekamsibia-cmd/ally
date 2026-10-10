"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

function Form() {
  const router = useRouter(), sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""), [pw, setPw] = useState("");
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const sb = supabaseBrowser();
    if (mode === "up") {
      const { data, error } = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your email for a confirmation link, then sign in.");
      else { router.push(next); router.refresh(); }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) setMsg(error.message); else { router.push(next); router.refresh(); }
    }
    setBusy(false);
  }
  return (
    <div className="center"><form className="panel" onSubmit={go}>
      <div className="logo"><Logo />Ally</div>
      <h2 style={{ margin: "14px 0 4px" }}>{mode === "in" ? "Welcome back" : "Create your account"}</h2>
      <p className="m" style={{ marginTop: 0 }}>Run influencer campaigns for your beauty brand.</p>
      <label htmlFor="e">Email</label><input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <label htmlFor="p">Password</label><input id="p" type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} />
      {msg && <p className="err" role="alert">{msg}</p>}
      <button className="btn p" style={{ width: "100%", padding: "9px" }} disabled={busy}>{busy ? "One moment..." : mode === "in" ? "Sign in" : "Sign up"}</button>
      <p className="m" style={{ textAlign: "center" }}>
        {mode === "in" ? "New to Ally? " : "Have an account? "}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>{mode === "in" ? "Create an account" : "Sign in"}</a>
      </p>
      <p className="m" style={{ textAlign: "center" }}><a href="/privacy">Privacy</a> and <a href="/terms">Terms</a></p>
    </form></div>
  );
}
export default function Login() { return <Suspense><Form /></Suspense>; }
