import { ctx } from "@/lib/ctx";
import { saveCreator, deleteCreator, importCreators } from "@/app/actions";
import { K } from "@/lib/util";
import PageHead from "@/components/PageHead";

const F = (c: any = {}) => (
  <div className="fg">
    <label>Name<input name="name" required defaultValue={c.name} /></label>
    <label>Instagram handle<input name="handle" defaultValue={c.handle} /></label>
    <label>City<input name="city" defaultValue={c.city} /></label>
    <label>Niche<input name="niche" defaultValue={c.niche} placeholder="Skincare" /></label>
    <label>Followers<input name="followers" type="number" min="0" defaultValue={c.followers} /></label>
    <label>Engagement %<input name="er" type="number" step="any" min="0" defaultValue={c.er} /></label>
    <label>Asking rate ₹<input name="rate" type="number" min="0" defaultValue={c.rate} /></label>
    <label>WhatsApp number (with 91)<input name="phone" defaultValue={c.phone} /></label>
    <label>Email<input name="email" type="email" defaultValue={c.email} /></label>
    <label>UPI ID<input name="upi" defaultValue={c.upi} /></label>
  </div>
);

export default async function Creators() {
  const { sb } = await ctx();
  const { data } = await sb.from("creators").select("*").order("created_at", { ascending: false });
  return (
    <><PageHead eyebrow="Creators" title="Your creators" sub="Everyone you work with, across all campaigns. Add them to a campaign from its Find creators tab." />
      <main className="w">
      <div className="row" style={{ alignItems: "flex-start" }}>
        <details className="box" open={!data?.length}>
          <summary className="btn p">Add a creator</summary>
          <form action={saveCreator.bind(null, null)}>{F()}<button className="btn p">Save creator</button></form>
        </details>
        <details className="box">
          <summary className="btn">Import CSV</summary>
          <form action={importCreators} className="pop">
            <p className="m">Columns: name, handle, city, niche, followers, engagement %, rate, phone, email, UPI. <a href="/sample-creators.csv" download>Download a sample</a>.</p>
            <input type="file" name="file" accept=".csv" required /><button className="btn p">Import</button>
          </form>
        </details>
        <a className="btn" href="/api/export?scope=creators">Export CSV</a>
      </div>
      <div className="tw" style={{ marginTop: 12 }}><table>
        <thead><tr><th>Creator</th><th>City</th><th>Niche</th><th>Followers</th><th>Engagement</th><th>Contact</th><th></th></tr></thead>
        <tbody>
          {data?.map((c: any) => (
            <tr key={c.id}>
              <td><b>{c.name}</b> <a className="m" target="_blank" rel="noopener" href={`https://instagram.com/${c.handle}`}>@{c.handle}</a></td>
              <td>{c.city}</td><td>{c.niche}</td><td>{K(c.followers)}</td><td>{c.er}%</td>
              <td className="m">{[c.phone, c.email, c.upi].filter(Boolean).join(", ") || "None yet"}</td>
              <td>
                <details><summary className="btn">Edit</summary>
                  <form action={saveCreator.bind(null, c.id)} style={{ whiteSpace: "normal", minWidth: 320 }}>{F(c)}
                    <div className="row"><button className="btn p">Save</button><button className="btn d" formAction={deleteCreator.bind(null, c.id)} formNoValidate>Delete</button></div>
                  </form>
                </details>
              </td>
            </tr>
          ))}
          {!data?.length && <tr><td colSpan={7} className="empty">No creators yet. Add one or import a CSV.</td></tr>}
        </tbody>
      </table></div>
    </main></>
  );
}
