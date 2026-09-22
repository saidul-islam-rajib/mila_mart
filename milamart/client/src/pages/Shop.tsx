
import { ArrowUpRight, PackageOpen, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import SiteFooter from "@/components/site/SiteFooter";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteHeader from "@/components/site/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import type { Product } from "@shared/commerce/types";

function money(amount: string) { return `৳ ${Number(amount).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`; }

function ProductTile({ product }: { product: Product }) {
  const { addItem, loading } = useCart();
  const variant = product.variants[0];
  const available = product.variants.some((item) => item.availableForSale);
  const image = product.images[0];
  const addToCart = async () => { if (variant?.availableForSale) await addItem(variant.id); };
  return <article className="shop-product-tile">
    <Link href={`/product/${product.handle}`} className="shop-product-image">{image ? <img src={image.url} alt={image.altText ?? product.title} /> : <span>MILA SHOP</span>}{!available && <b>Out of stock</b>}</Link>
    <div className="shop-product-copy"><p>{product.productType || "MILA SELECT"}</p><Link href={`/product/${product.handle}`}><h2>{product.title}</h2></Link><strong>{money(product.priceRange.min.amount)}</strong><button type="button" disabled={!available || loading} onClick={addToCart}>{available ? <><ShoppingBag size={16} /> Add to cart</> : "Stock out"}</button></div>
  </article>;
}

export default function Shop() {
  const productsQuery = trpc.commerce.products.list.useQuery({ first: 24 });
  const products = productsQuery.data ?? [];
  const [activeTag, setActiveTag] = useState("All");
  const tags = useMemo(() => ["All", ...Array.from(new Set(products.flatMap((product) => product.tags))).slice(0, 8)], [products]);
  const shownProducts = activeTag === "All" ? products : products.filter((product) => product.tags.includes(activeTag));
  return <div className="mila-site commerce-site"><SiteHeader /><main>
    <section className="shop-hero"><div><p>MILA SHOP & STUDIO</p><h1>Small changes.<br /><em>Big difference.</em></h1></div><div className="shop-hero-note"><span>SHOP ONLINE</span><p>স্টিকার, ওয়াল ফিনিশ ও নির্বাচিত home finds—একটি কার্ট, একটি সহজ checkout।</p></div></section>
    <section className="shop-toolbar"><div><p>EXPLORE THE CATALOG</p><h2>Shop by <em>your space.</em></h2></div><div className="shop-tags">{tags.map((tag) => <button className={activeTag === tag ? "active" : ""} type="button" key={tag} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div></section>
    <section className="shop-grid-wrap">
      {productsQuery.isLoading ? <div className="shop-empty"><PackageOpen size={38} /><h2>Loading the catalog…</h2><p>পণ্যগুলো প্রস্তুত হচ্ছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।</p></div> : shownProducts.length ? <div className="shop-grid">{shownProducts.map((product) => <ProductTile product={product} key={product.id} />)}</div> : <div className="shop-empty"><PackageOpen size={38} /><h2>The catalog is getting ready.</h2><p>প্রথম পণ্যগুলো প্রকাশ হলে এগুলো এখানেই দেখা যাবে এবং সরাসরি কার্টে যোগ করা যাবে। এখন স্টিকার বা ইন্টেরিয়র সার্ভিস নিয়ে কথা বলতে পারেন।</p><Link href="/stickers">Explore stickers <ArrowUpRight size={16} /></Link></div>}
    </section>
  </main><SiteFooter /><FloatingWhatsApp /></div>;
}
