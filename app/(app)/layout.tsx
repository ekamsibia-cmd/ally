import Link from "next/link";
import { ctx } from "@/lib/ctx";
import { signOut } from "@/app/actions";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { brandName, user } = await ctx();
  return (
    <>
      <div className="hero"><div className="w">
        <div className="brand">
          <Link href="/campaigns" className="logo"><Logo />Ally<span className="m" style={{ font: "400 14px var(--font-figtree)", marginLeft: 6 }}>{brandName}</span></Link>
          <nav className="mnav" aria-label="Main">
            <Link href="/campaigns">Campaigns</Link><Link href="/creators">Creators</Link><Link href="/team">Team</Link>
            <ThemeToggle />
            <form action={signOut}><button title={user.email}>Sign out</button></form>
          </nav>
        </div>
      </div></div>
      {children}
    </>
  );
}
