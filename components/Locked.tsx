import Link from "next/link";
export default function Locked({ feature }: { feature: string }) {
  return (
    <div className="card" style={{ maxWidth: 560, padding: 26 }}>
      <h3 style={{ margin: "0 0 6px", fontSize: 28 }}>{feature} are on the Growth plan and above</h3>
      <p className="m" style={{ fontSize: 15, margin: "0 0 16px" }}>Your campaigns and creators stay exactly as they are. Upgrade to switch this on.</p>
      <Link className="btn p lg" href="/billing">See plans</Link>
    </div>
  );
}
