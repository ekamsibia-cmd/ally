import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PLANS, planKey } from "@/lib/plan";

// Who is signed in, which brand they work for, and what that brand's plan allows. Every page and action starts here.
export async function ctx() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("members").select("brand_id, role, brands(name, plan)").eq("user_id", user.id).order("created_at").limit(1);
  const m: any = data?.[0];
  if (!m) redirect("/onboarding");
  const key = planKey(m.brands?.plan);
  return { sb, user, brandId: m.brand_id as string, brandName: (m.brands?.name ?? "") as string, role: m.role as string, planKey: key, plan: PLANS[key] };
}
