import Link from "next/link";
import { ctx } from "@/lib/ctx";
import { signOut } from "@/app/actions";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { brandName, user } = await ctx();
  return (
    <>
      <div className="top"><div className="w"><header className="pill app">
        <Link href="/campaigns" className="logo" aria-label="Ally home"><Logo size={44} /></Link>
        <span className="bn">{brandName}</span>
        <nav aria-label="Main">
          <Link href="/campaigns">Campaigns</Link><Link href="/creators">Creators</Link><Link href="/team">Team</Link><Link href="/billing">Billing</Link>
          <ThemeToggle />
          <form action={signOut}><button title={user.email}>Sign out</button></form>
        </nav>
      </header></div></div>
      {children}
    </>
  );
}
