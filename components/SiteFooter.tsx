import Link from "next/link";
import Logo from "./Logo";
import { CONTACT } from "@/lib/plan";

export function Band({ title = "Know what each creator earned you.", href = "/pricing", label = "See plans" }: { title?: string; href?: string; label?: string }) {
  return <div className="band"><h2>{title}</h2><Link className="btn lg" href={href}>{label}</Link></div>;
}
export default function SiteFooter() {
  return (
    <footer className="site">
      <div>
        <Link className="logo" href="/" aria-label="Ally home"><Logo size={48} /></Link>
        <p style={{ marginTop: 10 }}>Your assistant for influencer campaigns.</p>
      </div>
      <div className="contact" style={{ flexDirection: "column", gap: 4, margin: 0 }}>
        <span>Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></span>
        <span>Instagram: <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noopener">{CONTACT.instagramName} (@{CONTACT.instagram})</a></span>
      </div>
      <p><Link href="/pricing">Pricing</Link> · <Link href="/login">Sign in</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p>
    </footer>
  );
}
