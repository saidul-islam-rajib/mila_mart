
import { Menu, Phone, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";

const navItems = [
  ["/", "Home"],
  ["/shop", "Shop"],
  ["/stickers", "All Stickers"],
  ["/wallpapers", "Wall Papers"],
  ["/home-deco", "Home Deco Items"],
  ["/fashion", "Fashion"],
  ["/new-arrivals", "New Arrivals"],
  ["/decor-preview", "AI Decor"],
];

export default function SiteHeader() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  return (
    <header className="site-header catalog-header">
      <Link className="brand" href="/" onClick={() => setMenuOpen(false)} aria-label="Mila Interior Solutions হোমে যান">
        <img className="brand-logo" src="/manus-storage/mila-official-logo_8ac6afd4.png" alt="Mila Interior Solutions লোগো" />
        <span className="brand-copy"><strong>MILA</strong><small>INTERIOR SOLUTIONS</small></span>
      </Link>

      <nav className="desktop-nav catalog-nav" aria-label="প্রধান নেভিগেশন">
        {navItems.map(([href, label]) => (
          <Link key={href} href={href} className={location === href ? "active" : ""}>{label}</Link>
        ))}
        <Link href="/account" className={location === "/account" ? "active" : ""}>Account</Link>
      </nav>

      <a className="header-contact" href="tel:+8801404225856"><Phone size={15} aria-hidden="true" /><span>+880 1404 225856</span></a>
      <button className="cart-trigger" type="button" onClick={openCart} aria-label={`কার্ট খুলুন, ${itemCount}টি পণ্য`}>
        <ShoppingBag size={17} aria-hidden="true" /><span>Cart</span><b>{itemCount}</b>
      </button>
      <button className="mobile-menu-toggle" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="মেনু খুলুন" aria-expanded={menuOpen}>
        {menuOpen ? <X size={20} /> : <Menu size={21} />}
      </button>

      <nav className={menuOpen ? "mobile-nav is-open" : "mobile-nav"} aria-label="মোবাইল নেভিগেশন">
        {navItems.map(([href, label]) => (
          <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={location === href ? "active" : ""}>{label}</Link>
        ))}
        <Link href="/account" onClick={() => setMenuOpen(false)} className={location === "/account" ? "active" : ""}>Account</Link>
        <button type="button" onClick={() => { openCart(); setMenuOpen(false); }} className="mobile-cart-link">Cart ({itemCount})</button>
        <a href="mailto:milamartbd@gmail.com" onClick={() => setMenuOpen(false)}>milamartbd@gmail.com</a>
      </nav>
    </header>
  );
}
