/** Mila “Navy Atelier” wallpaper page: four material sub-categories with curated gallery browsing. */
import { ArrowUpRight, Check, MessageCircle, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import type { CollectionEntry } from "@/data/catalog";
import { wallpaperGalleryEntries } from "@/data/catalog";
import { addDesignSelection, getDesignSelection } from "@/lib/designSelection";

const WHATSAPP_URL = "https://wa.me/8801404225856?text=%E0%A6%86%E0%A6%B8%E0%A7%8D%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20Mila-%E0%A6%8F%E0%A6%B0%20%E0%A6%93%E0%A7%9F%E0%A6%BE%E0%A6%B2%E0%A6%AA%E0%A7%87%E0%A6%AA%E0%A6%BE%E0%A6%B0%20%E0%A6%A8%E0%A6%BF%E0%A7%9F%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4";
const DESIGN_SOURCE_URL = "https://drive.google.com/drive/folders/1dbOi0ArZKFbRGtIEo4kRqV2ZXlqM-F_f?usp=sharing";

type WallpaperGroup = { id: string; bangla: string; english: string; entries: CollectionEntry[] };

function WallpaperVisual({ entry, index }: { entry: CollectionEntry; index: number }) {
  const [hasError, setHasError] = useState(false);
  if (!entry.image || hasError) {
    return <span><b>{String(index + 1).padStart(2, "0")}</b><small>{entry.english}</small></span>;
  }
  return <img src={entry.image} alt={`${entry.bangla} room-scene wallpaper sample`} onError={() => setHasError(true)} />;
}

const wallpaperGroups: WallpaperGroup[] = [
  { id: "3d", bangla: "থ্রিডি ওয়ালপেপার", english: "3D Wallpaper", entries: wallpaperGalleryEntries.slice(4, 14) },
  { id: "emboss", bangla: "এম্বুস ওয়ালপেপার", english: "Emboss Wallpaper", entries: wallpaperGalleryEntries.slice(14, 24) },
  { id: "fabric", bangla: "ফেব্রিক ওয়ালপেপার", english: "Fabric Wallpaper", entries: wallpaperGalleryEntries.slice(24, 34) },
  { id: "pvc", bangla: "পিভিসি ওয়ালপেপার", english: "PVC Wallpaper", entries: wallpaperGalleryEntries.slice(34, 44) },
];

export default function Wallpapers() {
  const [active, setActive] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("category");
    return wallpaperGroups.some((group) => group.id === requested) ? requested! : "3d";
  });
  const currentGroup = wallpaperGroups.find((group) => group.id === active) ?? wallpaperGroups[0];
  const entries = useMemo(() => currentGroup.entries, [currentGroup]);
  const [selectedDesignIds, setSelectedDesignIds] = useState<string[]>(() => getDesignSelection().filter((item) => item.kind === "wallpaper").map((item) => item.id));
  const addToDesignCart = (entry: CollectionEntry) => {
    const id = `${currentGroup.id}-${entry.english.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const next = addDesignSelection({ id, kind: "wallpaper", category: currentGroup.id, english: entry.english, bangla: entry.bangla, image: entry.image });
    setSelectedDesignIds(next.filter((item) => item.kind === "wallpaper").map((item) => item.id));
  };

  return (
    <div className="mila-site catalog-site">
      <SiteHeader />
      <main className="sticker-page wallpaper-filter-page">
        <section className="sticker-top">
          <div><p className="catalog-eyebrow">MILA CATALOG — 02</p><h1>Wall <em>Papers</em></h1></div>
          <p>Choose a wall finish that suits your room light, furniture and mood. 3D, Emboss, Fabric ও PVC collection দেখুন।</p>
        </section>
        <section className="sticker-layout">
          <aside className="sticker-sidebar">
            <div className="sidebar-heading"><SlidersHorizontal size={16} aria-hidden="true" /><span>SUB CATEGORIES</span></div>
            <div className="category-list" role="tablist" aria-label="ওয়ালপেপার সাব-ক্যাটাগরি">
              {wallpaperGroups.map((group) => (
                <button type="button" role="tab" aria-selected={active === group.id} className={active === group.id ? "active" : ""} key={group.id} onClick={() => setActive(group.id)}>
                  <span>{group.bangla}</span><small>{group.english}</small>
                </button>
              ))}
            </div>
            <a className="sidebar-help" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={18} /> রুমের ছবি ও মাপ পাঠান</a>
          </aside>
          <div className="sticker-content">
            <div className="catalog-result-head"><div><p>{currentGroup.english}</p><h2>{currentGroup.bangla}</h2></div><a className="sticker-calculator-link" href={DESIGN_SOURCE_URL} target="_blank" rel="noreferrer">View design source <ArrowUpRight size={16} /></a></div>
            {selectedDesignIds.length > 0 && <div className="design-cart-note"><ShoppingBag size={15} /><span><strong>{selectedDesignIds.length} wallpaper style{selectedDesignIds.length > 1 ? "s" : ""} saved</strong> for consultation.</span><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Ask for a quote <ArrowUpRight size={14} /></a></div>}
            <div className="evidence-intro"><span>CURATED ROOM SCENES · {entries.length} DESIGNS</span><p>Each visual is a concept direction. Confirm wall measurements, light and installation details with Mila before ordering.</p></div>
            <div className="product-grid">{entries.map((entry, index) => (
              <article className="product-card" key={entry.english}>
                <div className="product-image"><WallpaperVisual entry={entry} index={index} /><span>{String(index + 1).padStart(2, "0")} · {currentGroup.english}</span></div>
                <div className="product-copy"><p className="english-label">{entry.english}</p><h3>{entry.bangla}</h3><p>{entry.detail}</p>{(() => { const id = `${currentGroup.id}-${entry.english.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; const orderUrl = `https://wa.me/8801404225856?text=${encodeURIComponent(`Hello Mila, I want a quote for ${entry.english} (${currentGroup.english}) wallpaper design.`)}`; return <div className="product-card-actions"><a className="product-order-now" href={orderUrl} target="_blank" rel="noreferrer">Order now <ArrowUpRight size={15} /></a><button type="button" className={selectedDesignIds.includes(id) ? "product-design-cart added" : "product-design-cart"} onClick={() => addToDesignCart(entry)}>{selectedDesignIds.includes(id) ? <><Check size={15} /> Design saved</> : <><ShoppingBag size={15} /> Add to design cart</>}</button></div>; })()}</div>
              </article>
            ))}</div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
