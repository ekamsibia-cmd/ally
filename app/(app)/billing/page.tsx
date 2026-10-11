import { ctx } from "@/lib/ctx";
import { PLANS, PLAN_LIST, CONTACT, getUsage, lim, type PlanKey } from "@/lib/plan";
import PageHead from "@/components/PageHead";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default async function Billing({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const { sb, plan, planKey, brandName, user } = await ctx();
  const u = await getUsage(sb);
  const choose = (sp.choose in PLANS ? sp.choose : "") as PlanKey | "";
  const msg = sp.limit ? `You've reached the ${plan.label} plan's limit for ${sp.limit}. Upgrade to add more.`
    : sp.feature ? `${sp.feature === "payments" ? "Payments" : "Results"} are on the Growth plan and above.`
    : choose && choose !== planKey ? `You picked ${PLANS[choose].label}. Email us below and we'll switch it on once your payment is confirmed.` : "";
  const meters: [string, number, number][] = [["Campaigns", u.campaigns, plan.campaigns], ["Creators", u.creators, plan.creators], ["Team members", u.members, plan.members]];
  const feats: [string, boolean][] = [["Pipeline, post tracking, message drafts, CSV", true], ["AI message drafts and read-outs", plan.ai], ["Payment tracking with UPI links", plan.payments], ["Results and return on spend", plan.results]];
  const mail = (k: PlanKey) => `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Upgrade ${brandName} to ${PLANS[k].label}`)}&body=${encodeURIComponent(`Brand: ${brandName}\nAccount email: ${user.email}\nPlan wanted: ${PLANS[k].label}`)}`;
  return (
    <>
      <PageHead title="Plan and billing" sub={<>You're on the <b>{plan.label}</b> plan</>} />
      <main className="w">
        {msg && <div className="verdict" role="status">{msg}</div>}
        <div className="grid2">
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 24 }}>Usage</h3>
            {meters.map(([l, n, max]) => (
              <div className="meter" key={l}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><b>{l}</b><span className="m">{n} of {lim(max)}</span></div>
                <div className="bar"><i style={{ width: `${max === Infinity ? 4 : Math.min(100, (n / max) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 24 }}>Included in {plan.label}</h3>
            {feats.map(([l, on]) => <div className="okrow" key={l}><span className={"tag " + (on ? "good" : "warn")}>{on ? "Included" : "Growth+"}</span><span style={{ color: on ? "var(--ink)" : "var(--mute)" }}>{l}</span></div>)}
          </div>
        </div>
        <h2 style={{ fontSize: 34, margin: "10px 0 14px" }}>Change plan</h2>
        <p className="sub" style={{ fontSize: 16, margin: "0 0 18px" }}>Email us to choose a paid plan. We confirm your payment and then switch the plan on for {brandName}.</p>
        <div className="plans">
          {PLAN_LIST.filter((p) => p.key !== planKey).map((p) => (
            <div className={"pl" + (p.key === choose ? " hot" : "")} key={p.key}>
              <h3>{PLANS[p.key].label}</h3><div className="d">{p.d}</div>
              <div className="price">{p.m == null ? "Custom" : p.m === 0 ? "₹0" : inr(p.m)}{p.m ? <small> /month</small> : null}</div>
              <ul style={{ marginTop: 16 }}>{p.f.map((x) => <li key={x} className={x.endsWith("|s") ? "soon" : ""}>{x.replace("|s", "")}</li>)}</ul>
              <a className={"btn lg" + (p.key === choose ? " p" : "")} href={mail(p.key)}>{p.key === "starter" ? "Ask about downgrading" : `Request ${PLANS[p.key].label}`}</a>
            </div>
          ))}
        </div>
        <div className="contact" style={{ marginTop: 26 }}>
          <span>Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></span>
          <span>Instagram: <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noopener">{CONTACT.instagramName} (@{CONTACT.instagram})</a></span>
        </div>
      </main>
    </>
  );
}
