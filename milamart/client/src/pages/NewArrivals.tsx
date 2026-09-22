
import { ArrowUpRight, BellRing, MessageCircle } from "lucide-react";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";

const WHATSAPP_URL = "https://wa.me/8801404225856?text=%E0%A6%86%E0%A6%B8%E0%A7%8D%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20Mila-%E0%A6%8F%E0%A6%B0%20New%20Arrivals%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4";

export default function NewArrivals() {
  return <div className="mila-site catalog-site"><SiteHeader /><main className="arrival-page"><section className="arrival-card"><p className="catalog-eyebrow">MILA CATALOG — 05</p><div className="arrival-ring"><BellRing size={30} /></div><span>UPCOMING</span><h1>New <em>Arrivals</em><br />শিগগিরই আসছে।</h1><p>নতুন স্টিকার ডিজাইন, ওয়ালপেপার, হোম ডেকোর ও ফ্যাশন কালেকশনের তথ্য এখানে যুক্ত হবে। প্রথমে জানতে চাইলে WhatsApp-এ একটি বার্তা পাঠান।</p><a className="gold-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={18} /> আগ্রহের কথা জানান <ArrowUpRight size={17} /></a></section></main><SiteFooter /><FloatingWhatsApp /></div>;
}
