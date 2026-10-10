import { ctx } from "@/lib/ctx";
import { toCsv } from "@/lib/util";

export async function GET(req: Request) {
  const { sb } = await ctx();
  const u = new URL(req.url), scope = u.searchParams.get("scope"), camp = u.searchParams.get("campaign");
  let rows: any[][];
  if (scope === "creators") {
    const { data } = await sb.from("creators").select("*").order("name");
    rows = [["name", "handle", "city", "niche", "followers", "er", "rate", "phone", "email", "upi"], ...(data || []).map((c) => [c.name, c.handle, c.city, c.niche, c.followers, c.er, c.rate, c.phone, c.email, c.upi])];
  } else {
    const { data } = await sb.from("campaign_creators").select("*, creators(*)").eq("campaign_id", camp || "");
    rows = [["name", "handle", "stage", "fee", "pay_status", "due", "live_date", "post_url", "tracking_no", "reach", "clicks", "orders"], ...(data || []).map((c: any) => [c.creators.name, c.creators.handle, c.stage, c.fee, c.pay_status, c.due, c.live_date, c.post_url, c.tracking_no, c.reach, c.clicks, c.orders])];
  }
  return new Response(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ally-${scope || "campaign"}.csv"` } });
}
