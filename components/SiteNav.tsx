import Link from "next/link";
import Logo from "./Logo";

export default function SiteNav({ signedIn = false, active }: { signedIn?: boolean; active?: "home" | "pricing" | "login" }) {
  return (
    <div className="top"><div className="w"><header className="pill">
      <Link className="logo" href="/" aria-label="Ally home"><Logo size={46} /></Link>
      <nav aria-label="Main">
        <Link className={active === "home" ? "on" : ""} href="/">Home</Link>
        <Link href="/#how">How it works</Link>
        <Link className={active === "pricing" ? "on" : ""} href="/pricing">Pricing</Link>
        {signedIn ? <Link className="btn p" href="/campaigns">Open app</Link> : (
          <><Link className={active === "login" ? "on" : ""} href="/login">Sign in</Link><Link className="btn p" href="/login?mode=up">Get started</Link></>
        )}
      </nav>
    </header></div></div>
  );
}
