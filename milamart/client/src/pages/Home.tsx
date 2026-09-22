
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  ClipboardCheck,
  Mail,
  MapPin,
  MessageCircle,
  MoveRight,
  Phone,
  Ruler,
} from "lucide-react";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { trpc } from "@/lib/trpc";

const WHATSAPP_URL =
  "https://wa.me/8801404225856?text=%E0%A6%86%E0%A6%B8%E0%A7%8D%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20Mila%20Interior%20Solutions-%E0%A6%8F%E0%A6%B0%20%E0%A6%B8%E0%A7%87%E0%A6%AC%E0%A6%BE%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4";

const services = [
  {
    number: "01",
    title: "ফার্নিচার মেকওভার",
    material: "wood",
    detail:
      "ফ্রিজ, ফ্রিজার, আলমারি, ওয়ারড্রোব, শু র‍্যাক, কিচেন ক্যাবিনেট ও নির্বাচিত পুরোনো ফার্নিচারে নতুন লুক ও উন্নত ফিনিশ।",
  },
  {
    number: "02",
    title: "কিচেন ও স্টোরেজ",
    material: "metal",
    detail:
      "ক্যাবিনেট রিফ্রেশ, ব্যবহারিক স্টোরেজ পরিকল্পনা ও কিচেন, ওয়ারড্রোব এবং ইউটিলিটি এরিয়ার সুন্দর বিন্যাস।",
  },
  {
    number: "03",
    title: "ওয়ালপেপার ইনস্টলেশন",
    material: "wallpaper",
    detail:
      "ঘরের আলো, থিম, দেয়ালের মাপ এবং ফার্নিচারের সঙ্গে সামঞ্জস্য রেখে ওয়ালপেপার নির্বাচন ও ইনস্টলেশন।",
  },
  {
    number: "04",
    title: "3D ও ইপোক্সি ফ্লোরিং",
    material: "flooring",
    detail:
      "নান্দনিক, টেকসই ও সহজে রক্ষণাবেক্ষণযোগ্য সারফেসের জন্য ডেকোরেটিভ 3D ও ইপোক্সি ফিনিশিং।",
  },
  {
    number: "05",
    title: "ব্র্যান্ডিং স্টিকার",
    material: "brass",
    detail:
      "বিল্ডিং, গেট ও নির্বাচিত গাড়ির জন্য স্টিকার ডিজাইন, তৈরি এবং দৃশ্যমানতার কথা মাথায় রেখে ইনস্টলেশন।",
  },
  {
    number: "06",
    title: "হোম ডেকোর ও স্টাইলিং",
    material: "linen",
    detail:
      "ওয়াল আর্ট, ফ্রেম, শোপিস ও নির্বাচিত ডেকোর উপকরণে একটি ঘরের শেষ ছোঁয়া ও ভিজ্যুয়াল ভারসাম্য।",
  },
];

const journey = [
  ["01", "আলোচনা", "আপনার পছন্দের ডিজাইন, প্রয়োজনীয় সেবা, ঘরের তথ্য বা প্রকল্পের ধারণা জানান।"],
  ["02", "অ্যাপয়েন্টমেন্ট", "প্রয়োজনটি বুঝে পরবর্তী ধাপ পরিকল্পনার জন্য সময় নির্ধারণ করা হয়।"],
  ["03", "সাইট ভিজিট ও মাপজোক", "প্রযোজ্য ক্ষেত্রে প্রতিনিধি লোকেশনে গিয়ে মাপজোক ও কাজের বিস্তারিত আলোচনা করেন।"],
  ["04", "ডিজাইন ও কোটেশন", "আলোচনা ও মূল্যায়নের পর কাজের পরিধি, উপকরণ, ডিজাইনের দিক ও কোটেশন প্রস্তুত করা হয়।"],
  ["05", "উপকরণ অনুমোদন", "উপকরণ, রং, ফিনিশ ও বাস্তবায়ন পরিকল্পনা চূড়ান্ত অনুমোদনের আগে পর্যালোচনা করা হয়।"],
  ["06", "ইনস্টলেশন ও হ্যান্ডওভার", "অনুমোদিত কাজ আপনার লোকেশনে সম্পন্ন করে হ্যান্ডওভার দেওয়া হয়।"],
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-eyebrow">
      <span className="eyebrow-line" />
      <span>{children}</span>
    </div>
  );
}

export default function Home() {
  const settings = trpc.site.publicSettings.useQuery();
  const publicCopy = settings.data ?? {};
  return (
    <div className="mila-site">
      <SiteHeader />

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <SectionEyebrow>Dhaka to Bangladesh · ঢাকা থেকে বাংলাদেশজুড়ে</SectionEyebrow>
            <p className="hero-kicker">{publicCopy.hero_kicker || "INTERIORS · SURFACE MAKEOVERS · HOME LIVING"}</p>
            <h1 id="hero-title">
              {publicCopy.hero_headline || <>Your space,<br /><em>made personal.</em></>}
            </h1>
            <p className="hero-intro">
              Interior solutions, surface makeovers and curated home finds—<strong>আপনার প্রয়োজন বুঝে</strong> একটি জায়গাকে আরও সুন্দর ও ব্যবহারযোগ্য করে তুলি।
            </p>
            <div className="hero-actions">
              <a className="gold-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                <MessageCircle size={18} aria-hidden="true" />
                Explore Mila Shop
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a className="text-link light" href="/shop">
                Shop online <ArrowDownRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="/manus-storage/mila-hero-interior-concept_5fd892be.jpg"
              alt="Mila-এর ইন্টেরিয়র কাজের ধরন বোঝাতে একটি ধারণাভিত্তিক লিভিং রুম ভিজ্যুয়াল"
            />
            <div className="hero-image-overlay" />
            <div className="hero-visual-note">
              <span>01</span>
              <p>Purposeful interiors,<br />made to be lived in.</p>
            </div>
            <p className="concept-label">ধারণাভিত্তিক ইন্টেরিয়র ভিজ্যুয়াল</p>
          </div>

          <div className="hero-side-note">
            <span>EST.</span>
            <strong>2023</strong>
            <span>DHAKA</span>
          </div>
        </section>

        <section className="statement-band" aria-label="Mila-এর প্রতিশ্রুতি">
          <p>ভালো design শুধু চোখে দেখা যায় না—<span>ব্যবহারে অনুভব করা যায়।</span></p>
          <MoveRight aria-hidden="true" />
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="section-rail">
            <SectionEyebrow>01 — Mila সম্পর্কে</SectionEyebrow>
            <p>MEASURED · PLANNED · TRANSFORMED</p>
          </div>
          <div className="about-content">
            <h2 id="about-title">সৌন্দর্য, আরাম এবং <em>বাস্তব ব্যবহারের</em> একসঙ্গে সমাধান।</h2>
            <div className="about-body">
              <p>
                আমরা শুধু দেখার জন্য রেনোভেশন করি না। মাপ, চলাচল, স্টোরেজ, আলো, থিম এবং দৈনন্দিন ব্যবহার—সবকিছুকে একসঙ্গে বিবেচনা করে আপনার জন্য উপযোগী জায়গা তৈরি করি।
              </p>
              <p>
                পুরোনো ফার্নিচারকে নতুন রূপ দেওয়া থেকে শুরু করে সম্পূর্ণ রুম বা প্রকল্প পরিকল্পনা পর্যন্ত, একটি সমন্বিত টিমের মাধ্যমে কাজের বাস্তবায়ন করি।
              </p>
            </div>
            <div className="trust-points">
              <div><Check size={17} aria-hidden="true" /> দক্ষ কারিগরি দল</div>
              <div><Check size={17} aria-hidden="true" /> লোকেশনভিত্তিক সেবা</div>
              <div><Check size={17} aria-hidden="true" /> বাস্তবসম্মত পরামর্শ</div>
            </div>
          </div>
        </section>

        <section className="stats-section" aria-label="Mila এক নজরে">
          <div className="stat-card featured">
            <span className="stat-overline">RENOVATION WORKS</span>
            <strong>1500<span>+</span></strong>
            <p>বিভিন্ন গ্রাহকের প্রয়োজন ও প্রকল্পের জন্য সম্পন্ন রেনোভেশন কাজ।</p>
          </div>
          <div className="stat-card">
            <strong>2023</strong>
            <p>ঢাকায় প্রতিষ্ঠিত</p>
          </div>
          <div className="stat-card">
            <strong>BD</strong>
            <p>দেশব্যাপী সেবার পরিধি</p>
          </div>
          <div className="stat-card">
            <strong>360°</strong>
            <p>সমন্বিত সেবা পদ্ধতি</p>
          </div>
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <div className="service-intro">
            <SectionEyebrow>02 — আমাদের সেবাসমূহ</SectionEyebrow>
            <h2 id="services-title">একটি প্রকল্প,<br /><em>একটি সমন্বিত পরিকল্পনা।</em></h2>
              <p>প্রতিটি কাজের পরিধি, উপকরণ ও ফিনিশ মাপজোক, আলোচনার এবং সাইটের বাস্তবতা অনুযায়ী নির্ধারণ করা হয়।</p>
            <a className="outline-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              সেবা নিয়ে আলোচনা করুন <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.number}>
                <div className="service-topline"><span>{service.number}</span><ArrowUpRight size={18} aria-hidden="true" /></div>
                <span className={`material-swatch ${service.material}`} aria-hidden="true" />
                <h3>{service.title}</h3>
                <p>{service.detail}</p>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label={`${service.title} সম্পর্কে WhatsApp-এ কথা বলুন`}>
                  বিস্তারিত জানতে <ChevronRight size={16} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="material-break" aria-label="উপকরণ, থিম এবং ফিনিশ">
          <div className="material-photo">
            <img src="/manus-storage/mila-materials-concept_aa6bb618.jpg" alt="Mila-এর উপকরণ ও ফিনিশিং দর্শন বোঝাতে একটি ধারণাভিত্তিক ম্যাটেরিয়াল ভিজ্যুয়াল" />
            <p className="concept-label dark">ধারণাভিত্তিক ম্যাটেরিয়াল ভিজ্যুয়াল</p>
          </div>
          <div className="material-copy">
            <SectionEyebrow>ম্যাটেরিয়াল থেকে মুড</SectionEyebrow>
            <blockquote>“একটি সম্পূর্ণ রুম আসলে একটি কম্পোজিশন।”</blockquote>
            <p>আলো, ফার্নিচার, ওয়ালপেপার, ওয়াল আর্ট, ফ্রেম, শোপিস এবং চলাচল—সবকিছুর সংযোগেই জায়গার পূর্ণতা তৈরি হয়।</p>
            <div className="material-list">
              <span>TEXTURE <small>উপকরণ ও সারফেস</small></span>
              <span>THEME <small>রঙ ও নকশার সামঞ্জস্য</small></span>
              <span>FINISH <small>শেষ কাজের মান</small></span>
            </div>
          </div>
        </section>

        <section className="process-section" id="process" aria-labelledby="process-title">
          <div className="process-head">
            <SectionEyebrow>03 — কাজের ধাপ</SectionEyebrow>
            <h2 id="process-title">পরিষ্কার process,<br /><em>সহজ সিদ্ধান্ত।</em></h2>
            <p>শুরু থেকে হ্যান্ডওভার পর্যন্ত প্রতিটি ধাপ বোঝা থাকলে আপনার সিদ্ধান্তও হয় আরও নিশ্চিন্ত।</p>
          </div>
          <ol className="journey-list">
            {journey.map(([number, title, detail]) => (
              <li key={number}>
                <span className="journey-number">{number}</span>
                <h3>{title}</h3>
                <p>{detail}</p>
                <span className="journey-line" />
              </li>
            ))}
          </ol>
          <div className="process-note">
            <ClipboardCheck size={20} aria-hidden="true" />
            <p><strong>স্বচ্ছ মূল্যায়ন:</strong> কোটেশন বিনামূল্যে নয়। আলোচনা ও মূল্যায়নের পর প্রযোজ্য চার্জ কাজ শুরুর আগেই জানানো হয়।</p>
          </div>
        </section>

        <section className="planning-section" aria-labelledby="planning-title">
          <div className="planning-image">
            <img src="/manus-storage/mila-kitchen-storage-concept_f0cd7e29.jpg" alt="কিচেন ও স্টোরেজ পরিকল্পনা বোঝাতে একটি ধারণাভিত্তিক ইন্টেরিয়র ভিজ্যুয়াল" />
            <p className="concept-label">ধারণাভিত্তিক ইন্টেরিয়র ভিজ্যুয়াল</p>
          </div>
          <div className="planning-copy">
            <SectionEyebrow>একটি ভালো পরিকল্পনার শুরু</SectionEyebrow>
            <h2 id="planning-title">প্রয়োজন বুঝি।<br /><em>তারপর রূপ দিই।</em></h2>
            <div className="planning-steps">
              <div><span>01</span><p><strong>বোঝা</strong>বাজেটের দিক, রুমের ব্যবহার ও পছন্দের নকশা শুনে শুরু করি।</p></div>
              <div><span>02</span><p><strong>পরিকল্পনা</strong>মাপ ও ধারণাকে উপকরণ, লেআউট ও ফিনিশের বাস্তব পরিকল্পনায় রূপ দিই।</p></div>
              <div><span>03</span><p><strong>বাস্তবায়ন</strong>দক্ষ কারিগর সমন্বয় করে অনুমোদিত পরিকল্পনা অনুযায়ী কাজ সম্পন্ন করি।</p></div>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="contact-kicker"><span className="eyebrow-line" /> 04 — যোগাযোগ</div>
          <div className="contact-main">
            <h2 id="contact-title">আপনার জায়গার<br /><em>নতুন গল্প শুরু হোক।</em></h2>
            <p>একটি নির্দিষ্ট কাজ, একাধিক সমন্বিত সেবা বা বড় প্রকল্প—আপনার প্রয়োজন নিয়ে কথা বলুন।</p>
            <a className="gold-button contact-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              <MessageCircle size={18} aria-hidden="true" /> WhatsApp-এ যোগাযোগ করুন <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="contact-details">
            <a href="tel:+8801404225856" className="contact-row"><Phone size={20} aria-hidden="true" /><span><small>PHONE / WHATSAPP</small><strong>+880 1404 225856</strong></span></a>
            <a href="mailto:milamartbd@gmail.com" className="contact-row"><Mail size={20} aria-hidden="true" /><span><small>EMAIL</small><strong>milamartbd@gmail.com</strong></span></a>
            <div className="contact-row"><MapPin size={20} aria-hidden="true" /><span><small>ADDRESS</small><strong>Mirpur-10, Fruits Market<br />Dhaka-1216, Bangladesh</strong></span></div>
            <div className="contact-row"><Ruler size={20} aria-hidden="true" /><span><small>SERVICE COVERAGE</small><strong>ঢাকায় বেশি সক্রিয় উপস্থিতি;<br />কাজের পরিধি অনুযায়ী দেশব্যাপী সেবা</strong></span></div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
