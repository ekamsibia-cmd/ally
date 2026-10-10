import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

// Who is signed in and which brand they work for. Every page and action starts here.
export async function ctx() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("members").select("brand_id, role, brands(name)").eq("user_id", user.id).order("created_at").limit(1);
  const m: any = data?.[0];
  if (!m) redirect("/onboarding");
  return { sb, user, brandId: m.brand_id as string, brandName: (m.brands?.name ?? "") as string, role: m.role as string };
}
