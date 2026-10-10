"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ctx } from "@/lib/ctx";
import { supabaseServer } from "@/lib/supabase/server";
import { STAGES, addDays, today, parseCsv } from "@/lib/util";

const num = (v: any) => Number(v) || 0;
const str = (v: any) => String(v ?? "").trim();
const fail = (e: any) => { if (e) throw new Error(e.message); };

export async function signOut() { const sb = await supabaseServer(); await sb.auth.signOut(); redirect("/login"); }

export async function createBrand(fd: FormData) {
  const sb = await supabaseServer();
  const { error } = await sb.rpc("create_brand", { p_name: str(fd.get("name")) });
  fail(error); redirect("/campaigns");
}

export async function createCampaign(fd: FormData) {
  const { sb, brandId } = await ctx();
  const { data, error } = await sb.from("campaigns").insert({
    brand_id: brandId, name: str(fd.get("name")), product: str(fd.get("product")), budget: num(fd.get("budget")),
    aov: num(fd.get("aov")), deliverables: str(fd.get("deliverables")),
  }).select("id").single();
  fail(error); redirect(`/campaigns/${data!.id}`);
}
export async function updateCampaign(id: string, fd: FormData) {
  const { sb } = await ctx();
  const { error } = await sb.from("campaigns").update({
    name: str(fd.get("name")), product: str(fd.get("product")), budget: num(fd.get("budget")), aov: num(fd.get("aov")), deliverables: str(fd.get("deliverables")),
  }).eq("id", id);
  fail(error); revalidatePath(`/campaigns/${id}`);
}
export async function deleteCampaign(id: string) {
  const { sb } = await ctx(); const { error } = await sb.from("campaigns").delete().eq("id", id);
  fail(error); redirect("/campaigns");
}

const creatorFields = (fd: FormData) => ({
  name: str(fd.get("name")), handle: str(fd.get("handle")).replace(/^@/, ""), city: str(fd.get("city")), niche: str(fd.get("niche")),
  followers: Math.round(num(fd.get("followers"))), er: num(fd.get("er")), rate: num(fd.get("rate")),
  phone: str(fd.get("phone")), email: str(fd.get("email")), upi: str(fd.get("upi")),
});
export async function saveCreator(id: string | null, fd: FormData) {
  const { sb, brandId } = await ctx();
  const f = creatorFields(fd); if (!f.name) return;
  const { error } = id ? await sb.from("creators").update(f).eq("id", id) : await sb.from("creators").insert({ ...f, brand_id: brandId });
  fail(error); revalidatePath("/creators"); revalidatePath("/campaigns", "layout");
}
export async function deleteCreator(id: string) {
  const { sb } = await ctx(); const { error } = await sb.from("creators").delete().eq("id", id);
  fail(error); revalidatePath("/creators");
}
// CSV columns: name, handle, city, niche, followers, er, rate, phone, email, upi (header row optional)
export async function importCreators(fd: FormData) {
  const { sb, brandId } = await ctx();
  const file = fd.get("file") as File | null; if (!file || !file.size) return;
  let rows = parseCsv(await file.text());
  if (rows[0] && /name/i.test(rows[0][0])) rows = rows.slice(1);
  const out = rows.filter((r) => r[0]?.trim()).map((r) => ({
    brand_id: brandId, name: r[0].trim(), handle: (r[1] || "").trim().replace(/^@/, ""), city: (r[2] || "").trim(), niche: (r[3] || "").trim(),
    followers: Math.round(num(r[4])), er: num(r[5]), rate: num(r[6]), phone: (r[7] || "").trim(), email: (r[8] || "").trim(), upi: (r[9] || "").trim(),
  }));
  if (out.length) { const { error } = await sb.from("creators").insert(out); fail(error); }
  revalidatePath("/creators");
}

export async function addToCampaign(campaignId: string, creatorId: string) {
  const { sb, brandId } = await ctx();
  const { error } = await sb.from("campaign_creators").insert({ brand_id: brandId, campaign_id: campaignId, creator_id: creatorId });
  fail(error); revalidatePath(`/campaigns/${campaignId}`);
}

// Move a creator one stage forward (+1) or back (-1). Going back from the first stage removes them from the campaign.
export async function moveStage(ccId: string, dir: number) {
  const { sb } = await ctx();
  const { data: cc } = await sb.from("campaign_creators").select("*, creators(rate)").eq("id", ccId).single();
  if (!cc) return;
  const i = STAGES.indexOf(cc.stage) + dir;
  if (i < 0) { await sb.from("campaign_creators").delete().eq("id", ccId); }
  else if (i < STAGES.length) {
    const patch: any = { stage: STAGES[i] };
    if (STAGES[i] === "Confirmed") { if (!cc.fee) patch.fee = (cc as any).creators?.rate || 0; if (!cc.due) patch.due = addDays(10); }
    if (STAGES[i] === "Posted" && !cc.live_date) patch.live_date = today();
    const { error } = await sb.from("campaign_creators").update(patch).eq("id", ccId); fail(error);
  }
  revalidatePath(`/campaigns/${cc.campaign_id}`);
}

// Update only the fields that were submitted
export async function updateCC(ccId: string, fd: FormData) {
  const { sb } = await ctx();
  const patch: any = {};
  for (const k of ["fee"]) if (fd.has(k)) patch[k] = num(fd.get(k));
  for (const k of ["reach", "clicks", "orders"]) if (fd.has(k)) patch[k] = str(fd.get(k)) === "" ? null : Math.round(num(fd.get(k)));
  for (const k of ["due", "live_date"]) if (fd.has(k)) patch[k] = str(fd.get(k)) || null;
  for (const k of ["post_url", "tracking_no"]) if (fd.has(k)) patch[k] = str(fd.get(k));
  const { data, error } = await sb.from("campaign_creators").update(patch).eq("id", ccId).select("campaign_id").single();
  fail(error); revalidatePath(`/campaigns/${data!.campaign_id}`);
}
export async function setPay(ccId: string, status: string) {
  const { sb } = await ctx();
  const { data, error } = await sb.from("campaign_creators").update({ pay_status: status }).eq("id", ccId).select("campaign_id").single();
  fail(error); revalidatePath(`/campaigns/${data!.campaign_id}`);
}
export async function markLive(ccId: string, fd: FormData) {
  const { sb } = await ctx();
  const { data, error } = await sb.from("campaign_creators").update({ stage: "Posted", live_date: today(), post_url: str(fd.get("post_url")) }).eq("id", ccId).select("campaign_id").single();
  fail(error); revalidatePath(`/campaigns/${data!.campaign_id}`);
}

export async function logMessage(ccId: string, channel: string, body: string) {
  const { sb, brandId } = await ctx();
  await sb.from("messages").insert({ brand_id: brandId, campaign_creator_id: ccId, channel, body });
}

export async function createInvite(fd: FormData) {
  const { sb, brandId } = await ctx();
  const email = str(fd.get("email")).toLowerCase(); if (!email) return;
  const { error } = await sb.from("invites").insert({ brand_id: brandId, email }); fail(error);
  revalidatePath("/team");
}
export async function removeMember(userId: string) {
  const { sb, brandId } = await ctx();
  const { error } = await sb.from("members").delete().eq("brand_id", brandId).eq("user_id", userId); fail(error);
  revalidatePath("/team");
}
