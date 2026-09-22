
import { ArrowUpRight, Calculator, Check, MessageCircle, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { stickerCategories, stickerProducts } from "@/data/catalog";
import { addDesignSelection, getDesignSelection } from "@/lib/designSelection";

const WHATSAPP_URL = "https://wa.me/8801404225856?text=%E0%A6%86%E0%A6%B8%E0%A7%8D%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20Mila-%E0%A6%8F%E0%A6%B0%20%E0%A6%B8%E0%A7%8D%E0%A6%9F%E0%A6%BF%E0%A6%95%E0%A6%BE%E0%A6%B0%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4";

export default function Stickers() {
  const [active, setActive] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("category");
    return stickerCategories.some((category) => category.id === requested) ? requested! : "all";
  });
  const currentCategory = stickerCategories.find((category) => category.id === active) ?? stickerCategories[0];
  const products = useMemo(() => active === "all" ? stickerProducts : stickerProducts.filter((product) => product.category === active), [active]);
  const [selectedDesignIds, setSelectedDesignIds] = useState<string[]>(() => getDesignSelection().filter((item) => item.kind === "sticker").map((item) => item.id));
  const addToDesignCart = (product: typeof stickerProducts[number]) => {
    const next = addDesignSelection({ id: product.id, kind: "sticker", category: product.category, english: product.english, bangla: product.bangla, image: product.image });
    setSelectedDesignIds(next.filter((item) => item.kind === "sticker").map((item) => item.id));
  };

  return (
    <div className="mila-site catalog-site">
      <SiteHeader />
      <main className="sticker-page">
        <section className="sticker-top">
          <div><p className="catalog-eyebrow">MILA CATALOG — 01</p><h1>All <em>Stickers</em></h1></div>
          <p>Explore surface ideas for refrigerators, cabinetry, doors and more. আপনার space ও পছন্দ অনুযায়ী design নির্বাচন করুন।</p>
        </section>
        <section className="sticker-layout">
          <aside className="sticker-sidebar">
            <div className="sidebar-heading"><SlidersHorizontal size={16} aria-hidden="true" /><span>SUB CATEGORIES</span></div>
            <div className="category-list" role="tablist" aria-label="স্টিকার সাব-ক্যাটাগরি">
              {stickerCategories.map((category) => (
                <button type="button" role="tab" aria-selected={active === category.id} className={active === category.id ? "active" : ""} key={category.id} onClick={() => setActive(category.id)}>
                  <span>{category.bangla}</span><small>{category.english}</small>
                </button>
              ))}
            </div>
            <a className="sidebar-help" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={18} /> আপনার পণ্যের মাপ পাঠান</a>
          </aside>
          <div className="sticker-content">
            <div className="catalog-result-head"><div><p>{currentCategory.english}</p><h2>{currentCategory.bangla}</h2></div><Link className="sticker-calculator-link" href="/sticker-order"><Calculator size={16} /> Size & price calculator</Link></div>
            {selectedDesignIds.length > 0 && <div className="design-cart-note"><ShoppingBag size={15} /><span><strong>{selectedDesignIds.length} design{selectedDesignIds.length > 1 ? "s" : ""} saved</strong> for your custom quote.</span><Link href="/sticker-order">Continue to order <ArrowUpRight size={14} /></Link></div>}
            {products.length > 0 && <div className="evidence-intro"><span>CURATED DESIGN DIRECTIONS</span><p>Each visual is a style reference. Final appearance depends on the actual surface, light and selected finish.</p></div>}
            {products.length > 0 ? <div className="product-grid">{products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image"><img src={product.image} alt={`${product.bangla} স্টিকার রূপান্তরের আগে ও পরে নমুনা`} /><span>BEFORE → AFTER</span></div>
                <div className="product-copy"><p className="english-label">{product.english}</p><h3>{product.bangla}</h3><p>{product.detail}</p><div className="product-card-actions"><Link className="product-order-now" href={`/sticker-order?category=${encodeURIComponent(product.category)}&design=${encodeURIComponent(product.id)}`}>Order now <ArrowUpRight size={15} /></Link><button type="button" className={selectedDesignIds.includes(product.id) ? "product-design-cart added" : "product-design-cart"} onClick={() => addToDesignCart(product)}>{selectedDesignIds.includes(product.id) ? <><Check size={15} /> Design saved</> : <><ShoppingBag size={15} /> Add to design cart</>}</button></div></div>
              </article>
            ))}</div> : <div className="custom-request-card"><span>MADE FOR YOUR SPACE</span><h3>{currentCategory.bangla}</h3><p>{currentCategory.note} আপনার পছন্দ, মাপ ও প্রয়োজন WhatsApp-এ পাঠালে আমরা উপযুক্ত ডিজাইন ও পরবর্তী ধাপ নিয়ে কথা বলব।</p><a className="gold-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp-এ মাপ পাঠান</a></div>}
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
