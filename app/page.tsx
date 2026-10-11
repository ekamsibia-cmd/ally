import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter, { Band } from "@/components/SiteFooter";
import LiveOrders from "@/components/LiveOrders";
import { isSignedIn } from "@/lib/auth";

const STEPS = [
  ["Find", "Filter creators by niche, engagement and rate. A fit score shows who suits a skincare launch."],
  ["Reach out", "Ready-made messages for every stage, sent by WhatsApp or email, with AI to make them personal."],
  ["Agree and pay", "Record the fee, the 50% advance and the final payment, with UPI links ready to tap."],
  ["Send product", "Track which kits have gone out and keep courier numbers beside each creator."],
  ["Check posts", "See what is due, overdue or live late, and nudge creators with one click."],
  ["Measure", "Enter reach, clicks and orders to see cost per order and return on every rupee spent."],
];
const ROWS = [
  { n: "Aanya V.", s: "Engaged", c: "#4f6b4a", k: "3 campaigns", img: "/creator-1.jpg" },
  { n: "Sameer K.", s: "Follow-up", c: "#b8742a", k: "7 campaigns", img: "/creator-2.jpg" },
  { n: "Noor B.", s: "Contacted", c: "#7a4851", k: "9 campaigns", img: "/creator-3.jpg" },
];

export default async function Home() {
  const signedIn = await isSignedIn();
  return (
    <>
      <SiteNav signedIn={signedIn} active="home" />
      <section className="shell tall"><div className="pin"><div className="hg">
        <div>
          <p className="eyebrow">Influencer campaigns for beauty brands</p>
          <h1>Run every creator campaign in one calm place.</h1>
          <p className="lede">Find creators, agree terms, send product and see what every post earned.</p>
          <div className="cta"><Link className="start" href={signedIn ? "/campaigns" : "/login?mode=up"}>Start<br />today</Link><Link className="ghost" href="#how">See how it works</Link></div>
        </div>
        <div className="vis" aria-label="Example of the Ally creator list">
          <div className="phone" role="img" aria-label="Example social post with the creator picture and high engagement"><div className="scr">
            <div className="ph"><span className="a"><img src="/hero-avatar.jpg" alt="" /></span><div><b>glow.with.aanya</b><small>Paid partnership</small></div><span style={{ marginLeft: "auto", letterSpacing: 2, fontWeight: 700 }}>···</span></div>
            <div className="pi"><img src="/hero-post.jpg" alt="Smiling person applying moisturiser to their cheek" /></div>
            <div className="ac">
              <svg viewBox="0 0 24 24" aria-label="Liked"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.5 6.7 4.5c2 0 3.5 1 5.3 3 1.8-2 3.3-3 5.3-3 3.7 0 5.8 3.8 4.3 7.3C19.500 16.400 12 21 12 21z" fill="#ed4956" /></svg>
              <svg viewBox="0 0 24 24" aria-label="Comment" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinejoin="round"><path d="M20.500 12a8.500 8.500 0 0 1-12.300 7.600L3.500 20.500l1-4.600A8.500 8.500 0 1 1 20.500 12z" /></svg>
              <svg viewBox="0 0 24 24" aria-label="Share" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><path d="M21.500 3 2.500 10.500l7 3 3 7zM9.500 13.500 21.500 3" /></svg>
              <svg className="bk" viewBox="0 0 24 24" aria-label="Save" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3h12v18l-6-4.500L6 21z" /></svg>
            </div>
            <div className="pt"><b>248,316 likes</b><div><b>glow.with.aanya</b> Two weeks with the new moisturiser and my skin feels calm all day. #ad</div><div className="g">View all 5,204 comments</div><div style={{ marginTop: 2 }}><b>kareena.s</b> Just ordered mine!! Where has this been all my life</div><div className="g" style={{ fontSize: 10, marginTop: 3 }}>2 HOURS AGO</div></div>
          </div></div>
          <span className="chip" style={{ left: "-5%", top: "9%" }}><i style={{ background: "#4f6b4a" }} />14.2% engagement</span>
          <span className="chip" style={{ right: "3%", top: "5%" }}>Reach 1.2M</span>
          <LiveOrders />
          <img className="prod" src="/product.jpg" alt="Pink moisturiser tube with a jade face tool" />
          <div className="rows">
            {ROWS.map((r) => <div className="rw" key={r.n}><div className="av"><img src={r.img} alt={`${r.n} profile picture`} /></div><b>{r.n}</b><span className="st2"><i style={{ background: r.c }} />{r.s}</span><span className="c">{r.k}</span></div>)}
          </div>
          <p className="tip">Example post and numbers for illustration.</p>
        </div>
      </div></div><div className="giant" aria-hidden="true">ALLY</div></section>
      <div className="w">
        <section className="sec first" id="how">
          <div className="shead"><h2>From first message to final result</h2><p className="sub">Six steps, all tracked on one board instead of spreadsheets, emails and DMs.</p></div>
          <div className="steps">{STEPS.map(([t, d], i) => <div className="stp" key={t}><div className="n">0{i + 1}</div><h3>{t}</h3><p>{d}</p></div>)}</div>
        </section>
        <Band />
        <SiteFooter />
      </div>
    </>
  );
}
