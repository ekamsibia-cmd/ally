"use client";
import { useState } from "react";
export default function AiReadout({ campaignId }: { campaignId: string }) {
  const [t, setT] = useState(""), [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setT("");
    try {
      const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "readout", id: campaignId }) });
      const j = await r.json(); setT(j.text || j.error || "No answer.");
    } catch { setT("AI is unavailable right now."); }
    setBusy(false);
  }
  return (<div><button className="btn p" onClick={go} disabled={busy}>{busy ? "Thinking..." : "Ask Ally for a read-out"}</button>{t && <p className="verdict" style={{ marginTop: 12, fontSize: 16, whiteSpace: "pre-wrap" }}>{t}</p>}</div>);
}
