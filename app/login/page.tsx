"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

function Form() {
  const router = useRouter(), sp = useSearchParams();
  const next = sp.get("next") || "/campaigns";
  const [mode, setMode] = useState<"in" | "up">(sp.get("mode") === "up" ? "up" : "in");
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
    <>
      <SiteNav active="login" />
      <section className="shell short" style={{ minHeight: 380 }}><div className="pin">
        <p className="eyebrow">{mode === "in" ? "Sign in" : "Create your account"}</p>
        <h1>{mode === "in" ? "Welcome back." : "Let's get you started."}</h1>
      </div><div className="giant sm" aria-hidden="true">ALLY</div></section>
      <form className="fc" onSubmit={go}>
        <h2 style={{ fontSize: 32, margin: "0 0 4px" }}>{mode === "in" ? "Your campaigns" : "Free to start"}</h2>
        <p className="sub" style={{ fontSize: 15, margin: "0 0 22px" }}>{mode === "in" ? "Sign in with your work email." : "Create a workspace for your brand in a minute."}</p>
        <label htmlFor="e">Email<input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@yourbrand.com" /></label>
        <label htmlFor="p">Password<input id="p" type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} /></label>
        {msg && <p className="err" role="alert">{msg}</p>}
        <button className="btn p lg" style={{ width: "100%" }} disabled={busy}>{busy ? "One moment..." : mode === "in" ? "Sign in" : "Sign up"}</button>
        <p className="m" style={{ textAlign: "center", marginTop: 16 }}>
          {mode === "in" ? "New to Ally? " : "Have an account? "}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>{mode === "in" ? "Create an account" : "Sign in"}</a>
        </p>
      </form>
      <div className="w"><SiteFooter /></div>
    </>
  );
}
export default function Login() { return <Suspense><Form /></Suspense>; }
