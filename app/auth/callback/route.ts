import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Email confirmation links land here, then the user goes on to the page they wanted.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") || "/";
  if (!next.startsWith("/")) next = "/";
  if (code) { const sb = await supabaseServer(); await sb.auth.exchangeCodeForSession(code); }
  return NextResponse.redirect(new URL(next, url.origin));
}
