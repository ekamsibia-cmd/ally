"use client";
import { useRef, useState } from "react";

type P = { ccId: string; name: string; handle: string; phone: string; email: string; text: string; brand: string; log: (id: string, ch: string, body: string) => Promise<void> };

export default function MessageDialog({ ccId, name, handle, phone, email, text, brand, log }: P) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [t, setT] = useState(text), [busy, setBusy] = useState(false), [note, setNote] = useState("");
  const enc = encodeURIComponent;
  const copy = () => { try { navigator.clipboard.writeText(t); } catch {} };
  async function ai() {
    setBusy(true); setNote("");
    try {
      const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "draft", id: ccId }) });
      const j = await r.json(); if (j.text) setT(j.text); else setNote(j.error || "AI is unavailable.");
    } catch { setNote("AI is unavailable."); }
    setBusy(false);
  }
  return (
    <>
      <button type="button" className="btn" onClick={() => { setT(text); dlg.current?.showModal(); }}>Message</button>
      <dialog ref={dlg} onClick={(e) => e.target === dlg.current && dlg.current?.close()}>
        <h2 style={{ margin: 0 }}>Message {name}</h2>
        <p className="m">Edit it, then send from the channel you already use.</p>
        <textarea value={t} onChange={(e) => setT(e.target.value)} aria-label="Message text" />
        <div className="row">
          <a className="btn" target="_blank" rel="noopener" href={`https://instagram.com/${enc(handle)}`} onClick={() => { copy(); log(ccId, "instagram", t); }}>Instagram DM</a>
          {phone ? <a className="btn s" target="_blank" rel="noopener" href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${enc(t)}`} onClick={() => log(ccId, "whatsapp", t)}>WhatsApp</a> : <span className="m">Add a phone number to enable WhatsApp</span>}
          {email ? <a className="btn" href={`mailto:${email}?subject=${enc(brand + " x " + name)}&body=${enc(t)}`} onClick={() => log(ccId, "email", t)}>Email</a> : null}
          <button type="button" className="btn" onClick={copy}>Copy</button>
          <button type="button" className="btn p" onClick={ai} disabled={busy}>{busy ? "Writing..." : "Write it with AI"}</button>
          <button type="button" className="btn" onClick={() => dlg.current?.close()}>Close</button>
        </div>
        {note && <p className="err" role="alert">{note}</p>}
        <p className="note">Instagram doesn't let apps send DMs. Ally copies the message and opens their profile.</p>
      </dialog>
    </>
  );
}
