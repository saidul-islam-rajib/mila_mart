
import { CircleAlert, LoaderCircle, PackageCheck, Search, ShieldCheck, Truck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { trpc } from "@/lib/trpc";

const INITIAL_LOOKUP = { orderNumber: "MLA-00000000", customerPhone: "000000" };
const statusCopy = {
  new: ["Order received", "আপনার অর্ডারটি পেয়েছি। যাচাই করে পরবর্তী আপডেট দেওয়া হবে।"],
  confirmed: ["Confirmed", "আপনার অর্ডার নিশ্চিত হয়েছে। প্রস্তুতির পরবর্তী ধাপ চলছে।"],
  processing: ["In preparation", "আপনার অর্ডার প্রস্তুত বা কাজের প্রক্রিয়ায় আছে।"],
  delivered: ["Delivered", "অর্ডারটি সম্পন্ন ও ডেলিভার্ড হিসেবে চিহ্নিত আছে।"],
  cancelled: ["Cancelled", "এই অর্ডারটি বাতিল হিসেবে চিহ্নিত আছে। বিস্তারিত জানতে আমাদের সঙ্গে কথা বলুন।"],
} as const;
const paymentCopy = { unpaid: "Payment pending", partial: "Partially paid", paid: "Payment received" } as const;

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [request, setRequest] = useState<typeof INITIAL_LOOKUP | null>(null);
  const [validationError, setValidationError] = useState("");
  const lookup = trpc.orders.lookup.useQuery(request ?? INITIAL_LOOKUP, { enabled: Boolean(request), retry: false });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedOrderNumber = orderNumber.trim().toUpperCase();
    const normalizedPhone = customerPhone.trim();
    if (!/^MLA-\d{8}$/.test(normalizedOrderNumber) || normalizedPhone.length < 6) {
      setValidationError("সঠিক Order no. (যেমন MLA-12345678) এবং অর্ডারে ব্যবহৃত mobile number দিন।");
      return;
    }
    setValidationError("");
    setRequest({ orderNumber: normalizedOrderNumber, customerPhone: normalizedPhone });
  }

  const record = lookup.data;
  const currentStatus = record ? statusCopy[record.status] : null;

  return <div className="mila-site tracking-site"><SiteHeader /><main>
    <section className="tracking-hero"><div><p>ORDER SUPPORT · STATUS LOOKUP</p><h1>Track your<br /><em>order status.</em></h1><span>আপনার অর্ডারের সর্বশেষ অবস্থা সহজে জানতে নিচের তথ্য দিন।</span></div><div className="tracking-hero-image"><img src="/manus-storage/mila-materials-concept_aa6bb618.jpg" alt="Mila-এর উপকরণ ও ফিনিশিংয়ের একটি ভিজ্যুয়াল" /><span>ORDER<br />CARE</span></div></section>
    <section className="tracking-shell"><div className="tracking-card"><div className="tracking-card-head"><span>ORDER LOOKUP</span><h2>Find your order</h2><p>Order confirmation-এ পাওয়া নম্বর ও একই mobile number ব্যবহার করুন।</p></div><form onSubmit={handleSubmit} className="tracking-form"><label>Order number<input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="MLA-12345678" autoComplete="off" /></label><label>Mobile number<input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" autoComplete="tel" /></label>{validationError && <p className="tracking-error"><CircleAlert size={16} /> {validationError}</p>}<button type="submit" disabled={lookup.isFetching}>{lookup.isFetching ? <><LoaderCircle size={17} className="spin" /> Checking status…</> : <><Search size={17} /> Check order status</>}</button></form><div className="tracking-privacy"><ShieldCheck size={17} /> আপনার address, email বা payment amount এখানে প্রকাশ করা হয় না।</div></div>
      <aside className="tracking-result" aria-live="polite">{lookup.isFetching ? <div className="tracking-state"><LoaderCircle className="spin" size={30} /><h2>Checking your order</h2><p>একটু অপেক্ষা করুন—অর্ডারের তথ্য যাচাই করা হচ্ছে।</p></div> : record && currentStatus ? <div className="tracking-found"><span className={`tracking-status ${record.status}`}>{currentStatus[0]}</span><h2>{record.orderNumber}</h2><p className="tracking-message">{currentStatus[1]}</p><dl><div><dt>Order item</dt><dd>{record.productSummary}</dd></div><div><dt>Quantity</dt><dd>{record.quantity}</dd></div><div><dt>Delivery</dt><dd>{record.deliveryMode === "home" ? "Home delivery" : record.deliveryMode === "courier" ? "Courier delivery" : "Pickup"}</dd></div><div><dt>Payment</dt><dd>{paymentCopy[record.paymentStatus]}</dd></div></dl><p className="tracking-help"><Truck size={17} /> প্রশ্ন থাকলে আপনার Order no. উল্লেখ করে WhatsApp-এ কথা বলুন।</p></div> : request && !lookup.isError ? <div className="tracking-state"><PackageCheck size={31} /><h2>Order not found</h2><p>Order no. এবং mobile number মিলিয়ে আবার চেষ্টা করুন। প্রয়োজন হলে WhatsApp-এ যোগাযোগ করুন।</p></div> : lookup.isError ? <div className="tracking-state"><CircleAlert size={31} /><h2>Unable to check now</h2><p>কিছুক্ষণ পরে আবার চেষ্টা করুন অথবা WhatsApp-এ যোগাযোগ করুন।</p></div> : <div className="tracking-state"><PackageCheck size={31} /><h2>Order update, in one place.</h2><p>আপনার অর্ডারের তথ্য দিলে এখানে সর্বশেষ status দেখা যাবে।</p></div>}</aside></section>
    <section className="tracking-note"><p>NEED HELP?</p><h2>Need an update?<br /><em>We’re here.</em></h2><span>Order no. হাতে রাখুন। আমাদের টিম ফোন বা WhatsApp-এ পরবর্তী ধাপ জানাবে।</span><a href="https://wa.me/8801404225856" target="_blank" rel="noreferrer">Talk on WhatsApp</a></section>
  </main><SiteFooter /><FloatingWhatsApp /></div>;
}
