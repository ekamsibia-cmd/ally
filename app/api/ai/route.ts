import { supabaseServer } from "@/lib/supabase/server";
import { roi, inr } from "@/lib/util";
import { PLANS, planKey } from "@/lib/plan";

// AI drafts and read-outs. The Anthropic key stays on the server; data is read with the user's own login, so row-level security applies.
export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });
  const { data: mem } = await sb.from("members").select("brands(plan)").eq("user_id", user.id).limit(1);
  if (!PLANS[planKey((mem?.[0] as any)?.brands?.plan)].ai) return Response.json({ error: "AI drafts and read-outs are on the Growth plan and above." }, { status: 403 });
  const gKey = process.env.GEMINI_API_KEY, aKey = process.env.ANTHROPIC_API_KEY;
  if (!gKey && !aKey) return Response.json({ error: "AI isn't set up yet. Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY on the server." }, { status: 503 });
  const { kind, id } = await req.json();
  let prompt = "";
  if (kind === "draft") {
    const { data: cc } = await sb.from("campaign_creators").select("*, creators(*), campaigns(*)").eq("id", id).single();
    if (!cc) return Response.json({ error: "Not found." }, { status: 404 });
    const { data: b } = await sb.from("brands").select("name").eq("id", cc.brand_id).single();
    prompt = `Write a short, warm, personal Instagram or WhatsApp message (under 80 words, no hashtags, plain text) from the brand "${b?.name}" to creator ${cc.creators.name} (@${cc.creators.handle}, ${cc.creators.niche}, ${cc.creators.city}). Product: ${cc.campaigns.product}. Deliverables: ${cc.campaigns.deliverables}. Pipeline stage: ${cc.stage}. Agreed fee: ${cc.fee ? inr(cc.fee) : "not yet agreed"}. Post due: ${cc.due || "not set"}. Output only the message.`;
  } else if (kind === "readout") {
    const { data: camp } = await sb.from("campaigns").select("*").eq("id", id).single();
    if (!camp) return Response.json({ error: "Not found." }, { status: 404 });
    const { data: ccs } = await sb.from("campaign_creators").select("*, creators(*)").eq("campaign_id", id);
    const live = (ccs || []).filter((c) => c.live_date);
    prompt = `You are a sharp influencer-marketing analyst for an Indian beauty brand. In under 120 words, plain text, say what worked, what didn't, and what to do in the next campaign. Data (INR): ` +
      JSON.stringify({ campaign: { product: camp.product, budget: camp.budget, aov: camp.aov }, summary: roi(ccs || [], +camp.aov), creators: live.map((c: any) => ({ niche: c.creators.niche, followers: c.creators.followers, er: c.creators.er, fee: c.fee, due: c.due, live: c.live_date, reach: c.reach, clicks: c.clicks, orders: c.orders })) });
  } else return Response.json({ error: "Unknown request." }, { status: 400 });

  // Uses Google Gemini when GEMINI_API_KEY is set (free tier), otherwise Anthropic.
  try {
    if (gKey) {
      const model = process.env.GEMINI_MODEL || "gemini-3.7-flash";
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": gKey, "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1000 } }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        console.error("Gemini error", r.status, j?.error?.message);
        const why = r.status === 429 ? "The free limit was reached. Wait a minute and try again." : r.status === 404 ? `Gemini model "${model}" wasn't found. Set GEMINI_MODEL to a current model from Google AI Studio.` : r.status === 400 || r.status === 403 ? "Gemini rejected the key. Check GEMINI_API_KEY." : "The AI service returned an error. Try again.";
        return Response.json({ error: why }, { status: 502 });
      }
      const text = (j.candidates?.[0]?.content?.parts || []).map((x: any) => x.text || "").join("").trim();
      return Response.json(text ? { text } : { error: "The AI returned an empty answer. Try again." });
    }
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": aKey!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return Response.json({ error: "The AI service returned an error. Try again." }, { status: 502 });
    const j = await r.json();
    return Response.json({ text: (j.content || []).map((x: any) => x.text || "").join("").trim() });
  } catch {
    return Response.json({ error: "Couldn't reach the AI service. Try again." }, { status: 502 });
  }
}
