import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/invite/" + token)}`);
  const { error } = await sb.rpc("accept_invite", { p_token: token });
  if (!error) redirect("/campaigns");
  return (
    <div className="center"><div className="panel">
      <h2 style={{ marginTop: 0 }}>We couldn't use this invite</h2>
      <p className="err">{error.message}</p>
      <p className="m">You're signed in as {user.email}. Ask your teammate to invite exactly this email, or sign in with the invited one.</p>
      <a className="btn" href="/campaigns">Go to Ally</a>
    </div></div>
  );
}
