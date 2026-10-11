import Link from "next/link";
import { ctx } from "@/lib/ctx";
import { createCampaign } from "@/app/actions";
import { inr } from "@/lib/util";
import PageHead from "@/components/PageHead";

export default async function Campaigns() {
  const { sb } = await ctx();
  const { data: camps } = await sb.from("campaigns").select("*, campaign_creators(fee)").order("created_at", { ascending: false });
  return (
    <><PageHead eyebrow="Campaigns" title="Your campaigns" sub="Every launch in one place." />
      <main className="w">
      <details className="box" open={!camps?.length}>
        <summary className="btn p">New campaign</summary>
        <form action={createCampaign}>
          <div className="fg">
            <label>Campaign name<input name="name" required placeholder="Monsoon launch" /></label>
            <label>Product<input name="product" required placeholder="Dewy Barrier Moisturiser" /></label>
            <label>Budget ₹<input name="budget" type="number" min="0" /></label>
            <label>Average order value ₹<input name="aov" type="number" min="0" /></label>
            <label>Deliverables<input name="deliverables" defaultValue="1 reel + 3 stories" /></label>
          </div>
          <button className="btn p">Create campaign</button>
        </form>
      </details>
      <div className="board" style={{ gridAutoFlow: "row", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
        {camps?.map((c: any) => {
          const committed = c.campaign_creators.reduce((s: number, x: any) => s + +x.fee, 0);
          return (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="card" style={{ textDecoration: "none" }}>
              <h3 style={{ margin: 0 }}>{c.name}</h3><div className="m">{c.product}</div>
              <div style={{ marginTop: 10 }}>{inr(committed)} <span className="m">of {inr(c.budget)}</span></div>
              <div className="bar"><i style={{ width: `${Math.min(100, (committed / (c.budget || 1)) * 100)}%` }} /></div>
              <div className="m" style={{ marginTop: 6 }}>{c.campaign_creators.length} creators</div>
            </Link>
          );
        })}
      </div>
      {!camps?.length && <p className="empty">No campaigns yet. Create your first one above.</p>}
    </main></>
  );
}
