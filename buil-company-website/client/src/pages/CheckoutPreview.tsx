/** Mila Shop & Studio checkout preview: a non-transactional visual reference for the future Shopify handoff. */
import { Check, ChevronRight, LockKeyhole, Mail, MapPin, Phone, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import SiteFooter from "@/components/site/SiteFooter";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteHeader from "@/components/site/SiteHeader";

const steps = ["Details", "Delivery", "Payment"];

export default function CheckoutPreview() {
  return <div className="mila-site checkout-preview-site"><SiteHeader /><main>
    <section className="checkout-hero"><div><p>ORDER EXPERIENCE · DESIGN PREVIEW</p><h1>Checkout,<br /><em>made clear.</em></h1><span>New order flow · আপনার গ্রাহকের জন্য সহজ, পরিচ্ছন্ন এবং বিশ্বাসযোগ্য।</span></div><div className="checkout-material-cue"><img src="/manus-storage/mila-materials-concept_aa6bb618.jpg" alt="Mila-এর উপকরণ ও ফিনিশিং দর্শন বোঝাতে ম্যাটেরিয়াল ভিজ্যুয়াল" /><span>DETAILS<br />MATTER</span></div><div className="checkout-hero-seal"><LockKeyhole size={21} /><strong>SECURE<br />BY DESIGN</strong></div></section>
    <section className="checkout-shell">
      <div className="checkout-column">
        <div className="checkout-steps" aria-label="Checkout steps">{steps.map((step, index) => <div className={index === 0 ? "active" : ""} key={step}><span>{index + 1}</span><b>{step}</b>{index < steps.length - 1 && <i />}</div>)}</div>
        <section className="checkout-card details-card"><header><span>01 · CUSTOMER DETAILS</span><h2>Your information</h2><p>আপনার অর্ডারের আপডেট ও ডেলিভারি নিশ্চিত করার জন্য তথ্য দিন।</p></header><div className="checkout-form-grid"><label>Full name<input placeholder="Your full name" /></label><label>Mobile number<input placeholder="01XXXXXXXXX" /></label><label className="wide">Email address <small>optional</small><input type="email" placeholder="you@email.com" /></label><label className="wide">Delivery address<textarea placeholder="House, road, area, city" /></label></div></section>
        <section className="checkout-card delivery-card"><header><span>02 · DELIVERY</span><h2>How should we deliver?</h2><p>আপনার সুবিধামতো delivery option নির্বাচন করুন।</p></header><div className="delivery-options"><button type="button" className="selected"><Truck size={21} /><span><b>Home delivery</b><small>আপনার ঠিকানায় ডেলিভারি</small></span><Check size={18} /></button><button type="button"><MapPin size={21} /><span><b>Courier delivery</b><small>কুরিয়ার সার্ভিসের মাধ্যমে</small></span></button></div></section>
      </div>
      <aside className="checkout-summary">
        <div className="summary-head"><span>YOUR ORDER</span><h2>Order summary</h2></div>
        <div className="summary-empty"><ShoppingBag size={27} /><h3>Your selected items</h3><p>কার্টে যোগ করা আসল পণ্য ও মূল্য এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।</p></div>
        <div className="summary-line"><span>Subtotal</span><strong>—</strong></div><div className="summary-line"><span>Delivery</span><strong>At checkout</strong></div><div className="summary-total"><span>Total</span><strong>—</strong></div>
        <div className="payment-preview"><div><LockKeyhole size={18} /><span><b>03 · SECURE PAYMENT</b><small>Payment method</small></span></div><p>স্টোর claim এবং payment method সক্রিয় হলে কার্ড বা উপলভ্য মোবাইল পেমেন্টের নিরাপদ বিকল্প Shopify Checkout-এ দেখাবে।</p></div>
        <button type="button" className="secure-payment-button">Continue to secure payment <ChevronRight size={18} /></button><div className="summary-trust"><ShieldCheck size={17} /> Payment processing is handled securely at Shopify Checkout.</div>
      </aside>
    </section>
    <section className="checkout-flow-note"><p>THE CUSTOMER JOURNEY</p><div><span><b>01</b> Add items</span><i /><span><b>02</b> Fill details</span><i /><span><b>03</b> Secure payment</span><i /><span><b>04</b> Order confirmation</span></div><small>লাইভ হওয়ার পরে এই নকশাটিই বাস্তব cart data এবং Shopify Checkout-এর সঙ্গে যুক্ত হবে।</small></section>
  </main><SiteFooter /><FloatingWhatsApp /></div>;
}
