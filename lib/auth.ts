import { supabaseServer } from "@/lib/supabase/server";

// Used on public pages to show "Open app" instead of "Sign in". Never throws.
export async function isSignedIn() {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    return !!user;
  } catch { return false; }
}
