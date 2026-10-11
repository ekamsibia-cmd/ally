"use client";
import { useEffect, useState } from "react";

const CITY = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Jaipur", "Kolkata", "Gurugram", "Ahmedabad"];
const AMT = [649, 649, 1298, 649, 1947, 649, 1298];
type T = { id: number; city: string; amt: number };

// Example order counter and notifications for the landing page. Numbers are illustrative.
export default function LiveOrders() {
  const [n, setN] = useState(184), [feed, setFeed] = useState<T[]>([]);
  useEffect(() => {
    let id = 0;
    const add = () => {
      setN((x) => x + 1 + Math.floor(Math.random() * 3));
      setFeed((f) => [{ id: id++, city: CITY[Math.floor(Math.random() * CITY.length)], amt: AMT[Math.floor(Math.random() * AMT.length)] }, ...f].slice(0, 3));
    };
    add(); add(); add();
    const t = setInterval(add, 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <span className="chip" style={{ left: "1%", top: "21%" }}><i style={{ background: "#ed4956" }} /><b>{n}</b> orders today</span>
      <div className="feed" aria-hidden="true">
        {feed.map((t) => <div className="toast" key={t.id}><div>New order<small>{t.city}</small></div><span>₹{t.amt.toLocaleString("en-IN")}</span></div>)}
      </div>
    </>
  );
}
