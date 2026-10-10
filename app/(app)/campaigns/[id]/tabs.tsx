import { STAGES, SC, inr, K, fit, paidAmt, postStatus, roi, rowRoas, template } from "@/lib/util";
import { moveStage, updateCC, setPay, markLive, addToCampaign, logMessage } from "@/app/actions";
import MessageDialog from "@/components/MessageDialog";
import AiReadout from "@/components/AiReadout";

const Av = ({ c }: { c: any }) => (
  <span className="av" style={{ background: `hsl(${(c.name.charCodeAt(0) * 37) % 360} 45% 55%)` }}>{c.name.split(" ").map((x: string) => x[0]).join("").slice(0, 2)}</span>
);
const Msg = ({ cc, camp, brand }: any) => (
  <MessageDialog ccId={cc.id} name={cc.creators.name} handle={cc.creators.handle} phone={cc.creators.phone} email={cc.creators.email} text={template(cc, camp, brand)} brand={brand} log={logMessage} />
);

export function Pipeline({ ccs, camp, brand }: any) {
  return (
    <div className="board">
      {STAGES.map((st, i) => {
        const L = ccs.filter((c: any) => c.stage === st);
        return (
          <div className="col" key={st}>
            <h3><span className="dot" style={{ background: SC[i] }} />{st}<em>{L.length}</em></h3>
            {L.map((cc: any) => {
              const c = cc.creators, p = postStatus(cc);
              return (
                <div className="card" key={cc.id}>
                  <div className="who"><Av c={c} /><div><b>{c.name}</b><div className="m">@{c.handle} · {K(c.followers)} · {c.er}%</div></div></div>
                  <div className="m" style={{ marginTop: 6 }}>{cc.fee ? "Fee " + inr(cc.fee) : "Asks " + inr(c.rate)}{cc.due && !cc.live_date ? ", due " + cc.due.slice(5) : ""}</div>
                  <div className="row">
                    {p && <span className={`tag ${p[1]}`}>{p[0]}</span>}
                    <form action={moveStage.bind(null, cc.id, -1)}><button className="btn" aria-label={i === 0 ? "Remove from campaign" : "Move back a stage"}>←</button></form>
                    {st !== "Posted" && <form action={moveStage.bind(null, cc.id, 1)}><button className="btn p">Next</button></form>}
                    <Msg cc={cc} camp={camp} brand={brand} />
                  </div>
                  <details>
                    <summary className="m" style={{ marginTop: 8 }}>Edit deal</summary>
                    <form className="pop" action={updateCC.bind(null, cc.id)}>
                      <label className="m">Agreed fee ₹<input name="fee" type="number" defaultValue={cc.fee} /></label>
                      <label className="m">Post due<input name="due" type="date" defaultValue={cc.due || ""} /></label>
                      <button className="btn">Save</button>
                    </form>
                  </details>
                </div>
              );
            })}
            {!L.length && <div className="m" style={{ padding: 6 }}>Nobody here</div>}
          </div>
        );
      })}
    </div>
  );
}

export async function Find({ camp, ccs, sp, sb }: any) {
  const { data } = await sb.from("creators").select("*").order("created_at");
  const used = new Set(ccs.map((c: any) => c.creator_id));
  const all = (data || []).filter((c: any) => !used.has(c.id));
  const niches = ["All", ...Array.from(new Set((data || []).map((c: any) => c.niche).filter(Boolean)))] as string[];
  const niche = sp.niche || "All", er = +sp.er || 0, max = +sp.max || 1e9;
  const L = all.filter((c: any) => (niche === "All" || c.niche === niche) && c.er >= er && c.rate <= max).sort((a: any, b: any) => fit(b) - fit(a));
  return (
    <>
      <form className="filters">
        <input type="hidden" name="tab" value="find" />
        <label>Niche<select name="niche" defaultValue={niche}>{niches.map((n) => <option key={n}>{n}</option>)}</select></label>
        <label>Min engagement %<input name="er" type="number" step="0.5" defaultValue={sp.er || ""} style={{ width: 90 }} /></label>
        <label>Max rate ₹<input name="max" type="number" step="5000" defaultValue={sp.max || ""} style={{ width: 110 }} /></label>
        <button className="btn p">Apply filters</button>
        <a className="btn" href="/creators">Add or import creators</a>
      </form>
      <div className="tw"><table>
        <thead><tr><th>Fit</th><th>Creator</th><th>City</th><th>Niche</th><th>Followers</th><th>Engagement</th><th>Rate</th><th></th></tr></thead>
        <tbody>
          {L.map((c: any) => (
            <tr key={c.id}>
              <td className="score">{fit(c)}</td>
              <td><div className="who"><Av c={c} /><span><b>{c.name}</b> <a className="m" target="_blank" rel="noopener" href={`https://instagram.com/${c.handle}`}>@{c.handle}</a></span></div></td>
              <td>{c.city}</td><td>{c.niche}</td><td>{K(c.followers)}</td><td>{c.er}%</td><td>{inr(c.rate)}</td>
              <td><form action={addToCampaign.bind(null, camp.id, c.id)}><button className="btn p">Shortlist</button></form></td>
            </tr>
          ))}
          {!L.length && <tr><td colSpan={8} className="empty">No creators to show. Add creators on the Creators page, or loosen the filters.</td></tr>}
        </tbody>
      </table></div>
      <p className="note">Fit score weighs niche match, engagement and audience size. Skincare creators with 40k to 150k followers and high engagement score best.</p>
    </>
  );
}

export function Payments({ ccs, camp, brand }: any) {
  const A = ccs.filter((c: any) => c.fee > 0), committed = ccs.reduce((s: number, c: any) => s + +c.fee, 0);
  return (
    <>
      <div className="tw"><table>
        <thead><tr><th>Creator</th><th>Fee</th><th>Status</th><th>Paid</th><th>Pending</th><th>Pay</th><th>Record</th></tr></thead>
        <tbody>
          {A.map((cc: any) => {
            const c = cc.creators, nxt = cc.pay_status === "unpaid" ? cc.fee / 2 : cc.fee - paidAmt(cc);
            return (
              <tr key={cc.id}>
                <td><b>{c.name}</b></td><td>{inr(cc.fee)}</td>
                <td><span className={`tag ${cc.pay_status === "paid" ? "good" : cc.pay_status === "advance" ? "warn" : "bad"}`}>{({ paid: "Paid in full", advance: "50% advance paid", unpaid: "Unpaid" } as any)[cc.pay_status]}</span></td>
                <td>{inr(paidAmt(cc))}</td><td>{inr(cc.fee - paidAmt(cc))}</td>
                <td>{cc.pay_status !== "paid" && (c.upi
                  ? <a className="btn s" href={`upi://pay?pa=${encodeURIComponent(c.upi)}&pn=${encodeURIComponent(c.name)}&am=${nxt}&cu=INR&tn=${encodeURIComponent(brand + " collab")}`}>Pay {inr(nxt)} by UPI</a>
                  : <a className="btn" href="/creators">Add UPI ID</a>)}</td>
                <td><div className="row" style={{ margin: 0 }}>
                  {cc.pay_status === "unpaid" && <form action={setPay.bind(null, cc.id, "advance")}><button className="btn">Advance paid</button></form>}
                  {cc.pay_status !== "paid" && <form action={setPay.bind(null, cc.id, "paid")}><button className="btn p">Fully paid</button></form>}
                </div></td>
              </tr>
            );
          })}
          {!A.length && <tr><td colSpan={7} className="empty">Agreed fees appear here once a creator is confirmed.</td></tr>}
        </tbody>
      </table></div>
      <p className="note">Remaining budget {inr(camp.budget - committed)}. UPI buttons open your payment app on a phone. Mark a payment as recorded once it goes through.</p>
    </>
  );
}

export function Posts({ ccs, camp, brand }: any) {
  const A = ccs.filter((c: any) => c.due);
  return (
    <div className="tw"><table>
      <thead><tr><th>Creator</th><th>Product</th><th>Courier no.</th><th>Due</th><th>Went live</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {A.map((cc: any) => {
          const p = postStatus(cc);
          return (
            <tr key={cc.id}>
              <td><b>{cc.creators.name}</b></td>
              <td>{["Shipped", "Posted"].includes(cc.stage) ? "Sent" : "Not sent"}</td>
              <td><form action={updateCC.bind(null, cc.id)} className="row" style={{ margin: 0 }}><input name="tracking_no" defaultValue={cc.tracking_no} placeholder="Courier no." style={{ width: 120 }} /><button className="btn">Save</button></form></td>
              <td>{cc.due}</td>
              <td>{cc.live_date ? (cc.post_url ? <a href={cc.post_url} target="_blank" rel="noopener">{cc.live_date}</a> : cc.live_date) : "–"}</td>
              <td>{p && <span className={`tag ${p[1]}`}>{p[0]}</span>}</td>
              <td><div className="row" style={{ margin: 0 }}>
                {!cc.live_date && cc.stage === "Confirmed" && <form action={moveStage.bind(null, cc.id, 1)}><button className="btn">Mark product sent</button></form>}
                {!cc.live_date && cc.stage === "Shipped" && (
                  <>
                    <form action={markLive.bind(null, cc.id)} className="row" style={{ margin: 0 }}><input name="post_url" type="url" placeholder="Post link (optional)" style={{ width: 170 }} /><button className="btn p">Post is live</button></form>
                    <Msg cc={cc} camp={camp} brand={brand} />
                  </>
                )}
              </div></td>
            </tr>
          );
        })}
        {!A.length && <tr><td colSpan={7} className="empty">Confirm a creator to start tracking a deadline.</td></tr>}
      </tbody>
    </table></div>
  );
}

export function Results({ ccs, camp }: any) {
  const aov = +camp.aov, r = roi(ccs, aov), L = ccs.filter((c: any) => c.live_date);
  const v = !r.n ? "Mark posts as live and enter their numbers to see if the campaign paid off."
    : r.roas >= 2 ? `Worth it. Every ₹1 spent brought back ₹${r.roas.toFixed(2)} in sales.`
    : r.roas >= 1 ? `About break-even. ₹1 spent brought back ₹${r.roas.toFixed(2)}, before repeat purchases.`
    : `Not paying back yet. ₹1 spent brought back ₹${r.roas.toFixed(2)}.`;
  const best = [...L].filter((c: any) => c.orders != null).sort((a, b) => rowRoas(b, aov) - rowRoas(a, aov))[0];
  return (
    <>
      <div className="verdict">{v}{best && r.n > 1 ? ` Best value: ${best.creators.name} at ${rowRoas(best, aov).toFixed(1)}x.` : ""}</div>
      <div className="stats">
        <div className="stat"><b>{inr(r.sp)}</b><span>spent on live posts</span></div><div className="stat"><b>{inr(r.rv)}</b><span>sales from posts</span></div>
        <div className="stat"><b>{r.sa ? inr(r.cpa) : "–"}</b><span>cost per order</span></div><div className="stat"><b>{r.rc ? inr(r.cpm) : "–"}</b><span>cost per 1,000 reached</span></div><div className="stat"><b>{r.cl ? inr(r.cpc) : "–"}</b><span>cost per click</span></div>
      </div>
      <div className="tw"><table>
        <thead><tr><th>Creator</th><th>Fee</th><th>Reach</th><th>Link clicks</th><th>Orders</th><th>Return</th><th></th></tr></thead>
        <tbody>
          {L.map((cc: any) => (
            <tr key={cc.id}>
              <td><b>{cc.creators.name}</b></td><td>{inr(cc.fee)}</td>
              <td colSpan={3}>
                <form id={"f" + cc.id} action={updateCC.bind(null, cc.id)} className="row" style={{ margin: 0 }}>
                  <input name="reach" type="number" min="0" defaultValue={cc.reach ?? ""} aria-label="Reach" placeholder="Reach" />
                  <input name="clicks" type="number" min="0" defaultValue={cc.clicks ?? ""} aria-label="Link clicks" placeholder="Clicks" />
                  <input name="orders" type="number" min="0" defaultValue={cc.orders ?? ""} aria-label="Orders" placeholder="Orders" />
                </form>
              </td>
              <td><b>{cc.orders != null ? rowRoas(cc, aov).toFixed(1) + "x" : "–"}</b>{cc.orders != null && <span className="rb" style={{ width: Math.min(90, rowRoas(cc, aov) * 22) }} />}</td>
              <td><button className="btn p" form={"f" + cc.id}>Save</button></td>
            </tr>
          ))}
          {!L.length && <tr><td colSpan={7} className="empty">No live posts yet.</td></tr>}
        </tbody>
      </table></div>
      <div style={{ marginTop: 14 }}><AiReadout campaignId={camp.id} /></div>
      <p className="note">Sales are orders × {inr(aov)}. Give every creator a unique discount code or link so orders can be counted. Reach and clicks come from the creator's Instagram Insights screenshot.</p>
    </>
  );
}
