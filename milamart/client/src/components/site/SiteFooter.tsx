
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "wouter";

export default function SiteFooter() {
  return (
    <footer className="catalog-footer">
      <div className="footer-brand">
        <img src="/manus-storage/mila-official-logo_8ac6afd4.png" alt="Mila Interior Solutions" />
        <span><strong>MILA INTERIOR SOLUTIONS</strong><small>Transforming Spaces. Elevating Living.</small></span>
      </div>
      <div className="footer-contact-list">
        <a href="tel:+8801404225856"><Phone size={15} aria-hidden="true" /> +880 1404 225856</a>
        <a href="mailto:milamartbd@gmail.com"><Mail size={15} aria-hidden="true" /> milamartbd@gmail.com</a>
        <span><MapPin size={15} aria-hidden="true" /> Mirpur-10, Fruits Market, Dhaka</span>
      </div>
      <div className="footer-meta"><span>Website domain</span><strong>mila-interior-solutions.com</strong><div className="footer-socials"><a href="https://www.facebook.com/search/top?q=mila%20interior%20solutions" target="_blank" rel="noreferrer"><MessageCircle size={14} /> Facebook</a><a href="https://t.me/+uBztsb6V_dlhZWY1" target="_blank" rel="noreferrer"><MessageCircle size={14} /> Telegram</a></div><Link href="/track-order">Track an order</Link><small>© {new Date().getFullYear()} Mila Interior Solutions · Developed by <a href="https://team-sober.com/" target="_blank" rel="noreferrer" className="footer-credit-link">Team Sober</a></small></div>
    </footer>
  );
}
