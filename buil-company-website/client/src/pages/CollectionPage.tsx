/** Mila “Navy Atelier” collection page: bilingual catalogue information without stock, price, or checkout claims. */
import { useState } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import type { CollectionEntry } from "@/data/catalog";

const WHATSAPP_URL = "https://wa.me/8801404225856?text=%E0%A6%86%E0%A6%B8%E0%A7%8D%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20Mila-%E0%A6%8F%E0%A6%B0%20%E0%A6%95%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%9F%E0%A6%BE%E0%A6%B2%E0%A6%97%20%E0%A6%A8%E0%A6%BF%E0%A7%9F%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4";

function CollectionVisual({ entry, index }: { entry: CollectionEntry; index: number }) {
  const [hasError, setHasError] = useState(false);
  if (!entry.image || hasError) {
    return <span><b>{String(index + 1).padStart(2, "0")}</b><small>{entry.english}</small></span>;
  }
  return <img src={entry.image} alt={`${entry.bangla} কাজের নমুনা`} onError={() => setHasError(true)} />;
}

type CollectionPageProps = {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  entries: CollectionEntry[];
  note: string;
};

export default function CollectionPage({ eyebrow, title, highlight, description, entries, note }: CollectionPageProps) {
  return (
    <div className="mila-site catalog-site">
      <SiteHeader />
      <main className="catalog-page">
        <section className="catalog-hero">
          <div><p className="catalog-eyebrow">{eyebrow}</p><h1>{title} <em>{highlight}</em></h1></div>
          <p>{description}</p>
        </section>
        <section className="collection-editorial-strip" aria-label="ক্যাটালগ গাইড">
          <div><span>01</span><strong>Material-led choice</strong><p>উপকরণ, আলো এবং ব্যবহারের ধরন—এই তিনটি বিবেচনায় বাছাই সহজ হয়।</p></div>
          <div><span>02</span><strong>Space-first advice</strong><p>আপনার রুমের ছবি বা আনুমানিক মাপ পাঠালে নির্বাচনের পরামর্শ আরও নির্ভুল হবে।</p></div>
          <div><span>03</span><strong>Talk before you decide</strong><p>পণ্য বা ফিনিশ সম্পর্কে জানার জন্য WhatsApp-এ সরাসরি কথা বলুন।</p></div>
        </section>
        <section className="collection-grid" aria-label={title}>
          {entries.map((entry, index) => (
            <article className="collection-card" key={entry.english}>
              <div className={`collection-visual ${entry.type}`}>
                <CollectionVisual entry={entry} index={index} />
              </div>
              <span className="collection-number">{String(index + 1).padStart(2, "0")}</span>
              <h2>{entry.bangla}</h2>
              <p className="english-label">{entry.english}</p>
              <p>{entry.detail}</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">বিস্তারিত জানুন <ArrowUpRight size={16} aria-hidden="true" /></a>
            </article>
          ))}
        </section>
        <section className="catalog-note"><MessageCircle size={22} aria-hidden="true" /><div><strong>পছন্দ ও প্রয়োজন জানাতে WhatsApp করুন</strong><p>{note}</p></div><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">কথা বলুন <ArrowUpRight size={17} /></a></section>
      </main>
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
