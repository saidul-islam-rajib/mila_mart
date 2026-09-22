import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { Link } from "wouter";

export default function Account() {
  const { user, loading } = useAuth();

  return <div className="mila-site account-site"><SiteHeader /><main className="account-shell">
    <section className="account-hero"><p>MILA CUSTOMER ACCOUNT</p><h1>Your details,<br /><em>kept with care.</em></h1><span>Sign in securely to keep your Mila profile and follow your order journey. We never ask staff to see or store a plaintext password.</span></section>
    {loading ? <section className="account-panel"><p>Checking your secure session…</p></section> : user ? <section className="account-panel"><div className="account-avatar">{(user.name || "M").slice(0, 1).toUpperCase()}</div><div><p className="account-kicker">SIGNED IN</p><h2>{user.name || "Mila customer"}</h2><span>{user.email || "Your verified account email"}</span><small>Your account is protected by secure OAuth. Customer order details remain private and are not shown publicly.</small></div><Link className="account-action" href="/track-order">Track an order</Link></section> : <section className="account-panel account-guest"><div><p className="account-kicker">SECURE SIGN-IN</p><h2>Keep your Mila journey together.</h2><span>Use secure sign-in to access your profile. Mila does not store passwords in the customer dashboard.</span></div><button type="button" className="account-action" onClick={() => startLogin()}>Sign in securely</button></section>}
    <section className="account-links"><Link href="/shop">Continue shopping</Link><Link href="/sticker-order">Custom sticker order</Link><Link href="/track-order">Track without exposing account data</Link></section>
  </main><SiteFooter /><FloatingWhatsApp /></div>;
}
