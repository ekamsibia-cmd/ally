export type PlanKey = "starter" | "growth" | "studio" | "enterprise";
export const CONTACT = { email: "ally.supportsite@gmail.com", instagram: "allyforbrands", instagramName: "Ally campaign management" };

type Plan = { label: string; campaigns: number; creators: number; members: number; payments: boolean; results: boolean; ai: boolean };
// Keep these limits identical to plan_limit() in supabase/plans.sql.
export const PLANS: Record<PlanKey, Plan> = {
  starter: { label: "Starter", campaigns: 1, creators: 15, members: 1, payments: false, results: false, ai: false },
  growth: { label: "Growth", campaigns: 5, creators: 200, members: 5, payments: true, results: true, ai: true },
  studio: { label: "Studio", campaigns: Infinity, creators: Infinity, members: 15, payments: true, results: true, ai: true },
  enterprise: { label: "Enterprise", campaigns: Infinity, creators: Infinity, members: Infinity, payments: true, results: true, ai: true },
};
export const planKey = (p?: string): PlanKey => ((p as PlanKey) in PLANS ? (p as PlanKey) : "starter");
export const lim = (n: number) => (n === Infinity ? "unlimited" : String(n));

// Marketing copy for the plans (shared by the pricing page and the billing page). Placeholder prices.
export const PLAN_LIST: { key: PlanKey; d: string; m: number | null; hot?: boolean; f: string[]; b: string }[] = [
  { key: "starter", d: "Try Ally on one real launch.", m: 0, f: ["1 active campaign", "Up to 15 creators", "Pipeline board", "Post tracking", "Message drafts", "CSV import and export", "1 user"], b: "Start free" },
  { key: "growth", d: "For brands running campaigns every month.", m: 2999, hot: true, f: ["5 active campaigns", "Up to 200 creators", "Up to 5 teammates", "AI message drafts and read-outs", "Payment tracking with UPI links", "Results and return on spend"], b: "Choose Growth" },
  { key: "studio", d: "For busy brands and small agencies.", m: 7999, f: ["Unlimited campaigns and creators", "Up to 15 teammates", "Everything in Growth", "Priority support", "Instagram insights connection|s", "Automatic creator payouts|s"], b: "Choose Studio" },
  { key: "enterprise", d: "For large teams and agencies with many brands.", m: null, f: ["Several brands in one account", "Unlimited teammates", "Custom onboarding", "Security review", "Dedicated support"], b: "Talk to us" },
];

// How many of each thing this brand already has (row-level security limits the counts to the signed-in brand).
export async function getUsage(sb: any) {
  const [c, r, m, i] = await Promise.all([
    sb.from("campaigns").select("id", { count: "exact", head: true }),
    sb.from("creators").select("id", { count: "exact", head: true }),
    sb.from("members").select("user_id", { count: "exact", head: true }),
    sb.from("invites").select("id", { count: "exact", head: true }).eq("accepted", false),
  ]);
  return { campaigns: c.count || 0, creators: r.count || 0, members: m.count || 0, invites: i.count || 0 };
}
