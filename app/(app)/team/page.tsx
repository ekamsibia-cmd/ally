import { headers } from "next/headers";
import { ctx } from "@/lib/ctx";
import { createInvite, removeMember } from "@/app/actions";
import PageHead from "@/components/PageHead";

export default async function Team() {
  const { sb, role, user, brandName } = await ctx();
  const { data: members } = await sb.from("members").select("*").order("created_at");
  const { data: invites } = role === "owner" ? await sb.from("invites").select("*").eq("accepted", false).order("created_at") : { data: [] as any[] };
  const h = await headers(); const origin = `${h.get("x-forwarded-proto") || "https"}://${h.get("host")}`;
  return (
    <><PageHead eyebrow="Team" title={`Team at ${brandName}`} sub="Teammates see the same campaigns and creators. Nobody outside this brand can." />
      <main className="w">
      <div className="tw"><table>
        <thead><tr><th>Member</th><th>Role</th><th></th></tr></thead>
        <tbody>{members?.map((m: any) => (
          <tr key={m.user_id}><td>{m.email}{m.user_id === user.id ? " (you)" : ""}</td><td>{m.role}</td>
            <td>{role === "owner" && m.user_id !== user.id && <form action={removeMember.bind(null, m.user_id)}><button className="btn d">Remove</button></form>}</td></tr>
        ))}</tbody>
      </table></div>
      {role === "owner" ? (
        <>
          <h2 style={{ marginTop: 28 }}>Invite a teammate</h2>
          <form action={createInvite} className="row" style={{ marginTop: 0 }}>
            <input name="email" type="email" required placeholder="teammate@yourbrand.com" style={{ minWidth: 260 }} /><button className="btn p">Create invite link</button>
          </form>
          <p className="note">Send them the link. They sign up or sign in with that exact email and are added automatically.</p>
          {invites?.map((i: any) => (
            <div className="card" key={i.id} style={{ marginTop: 10 }}><b>{i.email}</b><div className="m" style={{ wordBreak: "break-all" }}>{origin}/invite/{i.token}</div></div>
          ))}
        </>
      ) : <p className="note">Only the owner can invite or remove people.</p>}
    </main></>
  );
}
