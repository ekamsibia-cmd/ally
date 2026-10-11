import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export default function Page() {
  return (
    <>
      <SiteNav />
      <div className="prose">
        <h1>Privacy policy</h1>
        <p>Placeholder text. Replace this page with a Privacy policy reviewed by a lawyer before you launch or apply for Meta app review.</p>
        <p>Cover at least: what data Ally stores (account emails, creator names, handles, phone numbers, UPI IDs, campaign results), why, who can see it, how long it is kept, how people can ask for deletion, and how to contact you.</p>
      <p>Contact: ally.supportsite@gmail.com</p>
      </div>
      <div className="w"><SiteFooter /></div>
    </>
  );
}
