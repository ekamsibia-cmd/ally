export const STAGES = ["Shortlisted", "Contacted", "Negotiating", "Confirmed", "Shipped", "Posted"] as const;
export const SC = ["#c9a6d8", "#e6a0b7", "#f0b88c", "#8fc7a5", "#86b6e0", "#d0688a"];
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const days = (a: string, b: string) => Math.round((+new Date(a) - +new Date(b)) / 864e5);
export const inr = (n: any) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
export const K = (n: number) => (n >= 1e5 ? Math.round(n / 1e3) + "k" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n));

// How well a creator suits a skincare launch: niche match, engagement, audience size.
export const fit = (c: any) => {
  const nw: any = { skincare: 40, dermatology: 40, beauty: 30, wellness: 20, grooming: 15 };
  return Math.round((nw[String(c.niche).toLowerCase()] ?? 5) + Math.min(35, c.er * 5) + (c.followers < 150000 ? 25 : c.followers < 300000 ? 15 : 5));
};
export const paidAmt = (cc: any) => (cc.pay_status === "paid" ? +cc.fee : cc.pay_status === "advance" ? cc.fee / 2 : 0);

export function postStatus(cc: any): [string, string] | null {
  if (cc.live_date && cc.due) { const d = days(cc.live_date, cc.due); return d <= 0 ? ["On time", "good"] : ["Late " + d + "d", "bad"]; }
  if (cc.live_date) return ["Live", "good"];
  if (!cc.due || !["Confirmed", "Shipped"].includes(cc.stage)) return null;
  const d = days(cc.due, today());
  return d < 0 ? ["Overdue " + -d + "d", "bad"] : d <= 3 ? ["Due in " + d + "d", "warn"] : ["On track", "good"];
}

export function roi(ccs: any[], aov: number) {
  const L = ccs.filter((c) => c.live_date && c.orders != null);
  const sp = L.reduce((s, c) => s + +c.fee, 0), sa = L.reduce((s, c) => s + c.orders, 0);
  const rc = L.reduce((s, c) => s + (c.reach || 0), 0), cl = L.reduce((s, c) => s + (c.clicks || 0), 0), rv = sa * aov;
  return { n: L.length, sp, sa, rv, rc, cl, roas: sp ? rv / sp : 0, cpa: sa ? sp / sa : 0, cpm: rc ? (sp / rc) * 1e3 : 0, cpc: cl ? sp / cl : 0 };
}
export const rowRoas = (c: any, aov: number) => (c.orders != null && c.fee ? (c.orders * aov) / c.fee : 0);

export function template(cc: any, camp: any, brand: string) {
  const c = cc.creators, f = String(c.name).split(" ")[0], P = camp.product || "new launch", D = camp.deliverables || "1 reel + 3 stories";
  const p = postStatus(cc);
  if (cc.stage === "Shipped" && p && p[1] !== "good")
    return `Hi ${f}! Quick check-in on the ${brand} ${P} post. We had it down for ${cc.due} and haven't seen it go live yet. Is everything okay, and can you share a new date? Happy to help with anything you need.`;
  const T: any = {
    Shortlisted: `Hi ${f}, I'm from ${brand}. Your content is so honest and we'd love for you to try our new ${P}. We'd like to send you a kit and talk about a paid collaboration. Interested?`,
    Contacted: `Hi ${f}, following up on my note about the ${brand} ${P} collab. Happy to share the brief and rate card. Can we chat this week?`,
    Negotiating: `Hi ${f}, thanks for your rate. Our budget for this campaign allows ${inr(c.rate * 0.85)} for ${D}, with 50% advance. Would that work?`,
    Confirmed: `Hi ${f}, we're set! ${inr(cc.fee)} for ${D}, live by ${cc.due}. Please share your shipping address and we'll dispatch your kit. 50% advance goes out once your invoice is in.`,
    Shipped: `Hi ${f}, your ${P} kit should have reached you. The post is due on ${cc.due}. Please tag us and use your code in the caption. Shout if you need anything.`,
    Posted: `Hi ${f}, thank you for the post, it looks lovely! Could you send a screenshot of reach and link clicks from Insights? We'll release the final payment right after.`,
  };
  return T[cc.stage];
}

// CSV helpers (handles quoted commas and quotes)
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
export const toCsv = (rows: any[][]) => rows.map((r) => r.map((x) => '"' + String(x ?? "").replace(/"/g, '""') + '"').join(",")).join("\n");
