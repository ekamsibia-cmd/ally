"use client";
import Link from "next/link";
import { useState } from "react";
import { PLAN_LIST, PLANS, CONTACT } from "@/lib/plan";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function Pricing({ signedIn = false }: { signedIn?: boolean }) {
  const [y, setY] = useState(false);
  const href = (key: string, m: number | null) =>
    m == null ? `mailto:${CONTACT.email}?subject=${encodeURIComponent("Ally Enterprise enquiry")}`
    : key === "starter" ? (signedIn ? "/campaigns" : "/login?mode=up")
    : signedIn ? `/billing?choose=${key}` : `/login?mode=up&next=${encodeURIComponent("/billing?choose=" + key)}`;
  return (
    <>
      <div className="tog" role="group" aria-label="Billing period">
        <button className={y ? "" : "on"} onClick={() => setY(false)}>Monthly</button>
        <button className={y ? "on" : ""} onClick={() => setY(true)}>Yearly, 2 months free</button>
      </div>
      <div className="plans">
        {PLAN_LIST.map((p) => {
          const price = p.m == null ? "Custom" : p.m === 0 ? "₹0" : inr(y ? Math.round((p.m * 10) / 12) : p.m);
          const bill = p.m == null ? "Tailored to your team" : p.m === 0 ? "Free forever" : y ? `Billed ${inr(p.m * 10)} a year` : "Billed monthly";
          return (
            <div className={"pl" + (p.hot ? " hot" : "")} key={p.key}>
              {p.hot && <span className="badge">Most popular</span>}
              <h3>{PLANS[p.key].label}</h3><div className="d">{p.d}</div>
              <div className="price">{price}{p.m ? <small> /month</small> : null}</div><div className="bill">{bill}</div>
              <ul>{p.f.map((x) => x.endsWith("|s") ? <li className="soon" key={x}>{x.slice(0, -2)}</li> : <li key={x}>{x}</li>)}</ul>
              <Link className={"btn lg" + (p.hot ? " p" : "")} href={href(p.key, p.m)}>{p.b}</Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
