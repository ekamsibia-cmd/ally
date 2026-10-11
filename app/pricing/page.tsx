import SiteNav from "@/components/SiteNav";
import SiteFooter, { Band } from "@/components/SiteFooter";
import Pricing from "@/components/Pricing";
import { isSignedIn } from "@/lib/auth";

const FAQ = [
  ["Can I start without paying?", "Yes. Starter is free forever for one active campaign, so you can try a real launch before upgrading."],
  ["Can I change or cancel my plan?", "You can move up or down at any time. Cancel whenever you like and keep access until the end of the period you paid for."],
  ["How do I pay?", "Email ally.supportsite@gmail.com to choose a paid plan. We confirm your payment and then switch the plan on for your brand."],
  ["Is my creators' data private?", "Every brand's data is kept separate. Teammates you invite see your campaigns, and nobody outside your brand can."],
  ["Does Ally pay creators or post on Instagram for me?", "Not yet. Ally opens UPI links for you to pay and records payments. Instagram insights and automatic payouts are on the way and marked as coming soon."],
];

export default async function PricingPage() {
  const signedIn = await isSignedIn();
  return (
    <>
      <SiteNav signedIn={signedIn} active="pricing" />
      <section className="shell short" style={{ minHeight: 440 }}><div className="pin">
        <p className="eyebrow">Pricing</p><h1>Simple plans that grow with your campaigns.</h1>
        <p className="lede" style={{ margin: 0 }}>Start free. Upgrade when you run more campaigns or bring in your team.</p>
      </div><div className="giant sm" aria-hidden="true">ALLY</div></section>
      <div className="w">
        <section className="sec first"><Pricing signedIn={signedIn} /><p className="m" style={{ marginTop: 16 }}>Plan names, limits and prices on this page are placeholders. Set your own before launch. Each plan's limits and features are enforced inside the app.</p></section>
        <section className="sec">
          <div className="shead"><h2>Questions</h2><p className="sub">Anything else? Write to ally.supportsite@gmail.com.</p></div>
          <div style={{ maxWidth: 880 }}>{FAQ.map(([q, a]) => <details className="faq" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </section>
        <Band />
        <SiteFooter />
      </div>
    </>
  );
}
