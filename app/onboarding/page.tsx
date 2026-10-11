import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { createBrand, signOut } from "@/app/actions";
import Logo from "@/components/Logo";

export default async function Onboarding() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("members").select("brand_id").eq("user_id", user.id).limit(1);
  if (data?.length) redirect("/campaigns");
  return (
    <div className="center"><form className="panel" action={createBrand}>
      <div className="logo"><Logo size={52} /></div>
      <h2 style={{ margin: "14px 0 4px" }}>Name your brand</h2>
      <p className="m" style={{ marginTop: 0 }}>This creates your workspace. You can invite teammates next. If a teammate invited you, open their invite link instead.</p>
      <label htmlFor="n">Brand name</label><input id="n" name="name" required placeholder="Glowkind" />
      <button className="btn p" style={{ width: "100%", padding: "9px" }}>Create workspace</button>
      <p className="m" style={{ textAlign: "center" }}>Signed in as {user.email}. <button className="btn" formAction={signOut} formNoValidate>Sign out</button></p>
    </form></div>
  );
}
