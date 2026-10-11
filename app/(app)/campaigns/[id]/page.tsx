import Link from "next/link";
import { notFound } from "next/navigation";
import { ctx } from "@/lib/ctx";
import { updateCampaign, deleteCampaign } from "@/app/actions";
import { inr, paidAmt, postStatus, roi } from "@/lib/util";
import { Pipeline, Find, Payments, Posts, Results } from "./tabs";
import PageHead from "@/components/PageHead";
import Locked from "@/components/Locked";

const TABS: [string, string][] = [["pipeline", "Pipeline"], ["find", "Find creators"], ["payments", "Payments"], ["posts", "Posts"], ["results", "Results"]];

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<any> }) {
  const { id } = await params, sp = await searchParams, tab = sp.tab || "pipeline";
  const { sb, brandName, plan } = await ctx();
  const { data: camp } = await sb.from("campaigns").select("*").eq("id", id).single();
  if (!camp) notFound();
  const { data } = await sb.from("campaign_creators").select("*, creators(*)").eq("campaign_id", id).order("created_at");
  const ccs = data || [];
  const committed = ccs.reduce((s, c) => s + +c.fee, 0), paid = ccs.reduce((s, c) => s + paidAmt(c), 0);
  const overdue = ccs.filter((c) => { const p = postStatus(c); return p && p[1] === "bad" && !c.live_date; }).length;
  const r = roi(ccs, +camp.aov);
  return (
    <>
      <PageHead eyebrow="Campaign" title={camp.name} sub={<><Link href="/campaigns">All campaigns</Link> · {camp.product} · {camp.deliverables}</>}>
        <div className="stats">
          <div className="stat"><b>{inr(committed)}</b><span>committed of {inr(camp.budget)}</span><div className="bar"><i style={{ width: `${Math.min(100, (committed / (camp.budget || 1)) * 100)}%` }} /></div></div>
          {plan.payments && <div className="stat"><b>{inr(paid)}</b><span>paid to creators</span></div>}
          <div className="stat"><b style={{ color: overdue ? "var(--bad)" : "var(--sage)" }}>{overdue}</b><span>posts overdue</span></div>
          {plan.results && <div className="stat"><b>{r.n ? r.roas.toFixed(1) + "x" : "–"}</b><span>sales per ₹1 spent</span></div>}
        </div>
        <nav className="tabs" aria-label="Campaign sections">{TABS.map(([k, l]) => <Link key={k} href={`?tab=${k}`} className={tab === k ? "on" : ""}>{l}{((k === "payments" && !plan.payments) || (k === "results" && !plan.results)) && <span className="lk">Growth</span>}</Link>)}</nav>
      </PageHead>
      <main className="w">
        {tab === "pipeline" && <Pipeline ccs={ccs} camp={camp} brand={brandName} />}
        {tab === "find" && <Find camp={camp} ccs={ccs} sp={sp} sb={sb} />}
        {tab === "payments" && (plan.payments ? <Payments ccs={ccs} camp={camp} brand={brandName} /> : <Locked feature="Payments" />)}
        {tab === "posts" && <Posts ccs={ccs} camp={camp} brand={brandName} />}
        {tab === "results" && (plan.results ? <Results ccs={ccs} camp={camp} /> : <Locked feature="Results" />)}
        <p style={{ marginTop: 24 }}><a className="btn" href={`/api/export?campaign=${id}`}>Export this campaign as CSV</a></p>
        <details className="box">
          <summary className="btn">Campaign settings</summary>
          <form action={updateCampaign.bind(null, id)}>
            <div className="fg">
              <label>Name<input name="name" defaultValue={camp.name} required /></label>
              <label>Product<input name="product" defaultValue={camp.product} /></label>
              <label>Budget ₹<input name="budget" type="number" defaultValue={camp.budget} /></label>
              <label>Average order value ₹<input name="aov" type="number" defaultValue={camp.aov} /></label>
              <label>Deliverables<input name="deliverables" defaultValue={camp.deliverables} /></label>
            </div>
            <div className="row"><button className="btn p">Save settings</button><button className="btn d" formAction={deleteCampaign.bind(null, id)} formNoValidate>Delete campaign</button></div>
          </form>
        </details>
      </main>
    </>
  );
}
