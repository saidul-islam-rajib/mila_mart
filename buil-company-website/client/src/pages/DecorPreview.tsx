import { CircleAlert, ImageUp, LayoutPanelTop, LoaderCircle, Palette, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import FloatingWhatsApp from "@/components/site/FloatingWhatsApp";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { trpc } from "@/lib/trpc";

type DecorReport = {
  requestId: string;
  photoType: "furniture" | "room";
  status: string;
  generatedPreviewUrl: string | null;
  recommendation: {
    detectedSubject: string;
    spaceSummary: string;
    styleDirection: string;
    recommendedActions: Array<{ area: string; title: string; detail: string; priority: string }>;
    stickerSuggestion: { material: string; finish: string; placement: string; reason: string };
    wallpaperSuggestion: { material: string; placement: string; reason: string };
    furniturePlacement: string;
    frameAndAccentPlan: string;
    palette: string[];
    assumptions: string[];
    safetyNotice: string;
  } | null;
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read photo"));
    reader.onerror = () => reject(new Error("Unable to read photo"));
    reader.readAsDataURL(file);
  });
}

export default function DecorPreview() {
  const [photoType, setPhotoType] = useState<"furniture" | "room">("furniture");
  const [subjectType, setSubjectType] = useState("Refrigerator / Fridge");
  const [stylePreference, setStylePreference] = useState("Modern elegant");
  const [budgetPreference, setBudgetPreference] = useState("Balanced");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<DecorReport | null>(null);
  const [activeImage, setActiveImage] = useState<"source" | "concept">("source");
  const analyze = trpc.decor.analyze.useMutation();
  const generatePreview = trpc.decor.generatePreview.useMutation();

  async function selectPhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > MAX_FILE_BYTES) {
      setPhotoDataUrl("");
      setFileName("");
      setError("PNG, JPEG বা WebP image দিন; file size 8 MB-এর মধ্যে হতে হবে।");
      return;
    }
    try {
      setPhotoDataUrl(await readFileAsDataUrl(file));
      setFileName(file.name);
      setReport(null);
      setActiveImage("source");
    } catch {
      setError("ছবিটি read করা যায়নি। অন্য একটি image দিয়ে চেষ্টা করুন।");
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photoDataUrl) return setError("প্রথমে একটি furniture অথবা room photo নির্বাচন করুন।");
    if (!consent) return setError("ছবি ব্যবহার ও AI analysis-এর অনুমতিতে সম্মতি দিন।");
    setError("");
    setReport(null);
    try {
      const upload = await fetch("/api/decor-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: photoDataUrl, consent, photoType, subjectType, stylePreference, budgetPreference }),
      });
      const payload = await upload.json() as { requestId?: string; error?: string };
      if (!upload.ok || !payload.requestId) throw new Error(payload.error ?? "Photo upload failed");
      const nextReport = await analyze.mutateAsync({ requestId: payload.requestId });
      setReport(nextReport as DecorReport);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI analysis এখন সম্পন্ন করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।");
    }
  }

  async function handleGeneratePreview() {
    if (!report) return;
    setError("");
    try {
      const nextReport = await generatePreview.mutateAsync({ requestId: report.requestId });
      setReport(nextReport as DecorReport);
      setActiveImage("concept");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Visual preview এখন তৈরি করা যায়নি। পরে আবার চেষ্টা করুন।");
    }
  }

  const isBusy = analyze.isPending || generatePreview.isPending;
  const recommendation = report?.recommendation;

  return <div className="mila-site decor-site"><SiteHeader /><main>
    <section className="decor-hero"><div><p>AI DECOR PREVIEW · CONCEPT STUDIO</p><h1>See the possibility<br /><em>before you decorate.</em></h1><span>ফ্রিজ, deep freezer, almirah অথবা পুরো room-এর ছবি দিন। আপনার space-এর জন্য decor direction আগে দেখে নিন।</span></div><div className="decor-hero-art"><img src="/manus-storage/mila-materials-concept_aa6bb618.jpg" alt="Mila materials and interior inspiration" /><span>CONCEPT<br />ONLY</span></div></section>
    <section className="decor-workspace"><form className="decor-form" onSubmit={handleAnalyze}><div className="decor-form-head"><span>01 · PHOTO BRIEF</span><h2>Tell us what you see.</h2><p>AI আপনার নিজের দেওয়া image দেখে inspiration সাজাবে; কোনো exact measurement বা final installation plan দেবে না।</p></div>
      <div className="decor-choice-row"><button type="button" className={photoType === "furniture" ? "selected" : ""} onClick={() => setPhotoType("furniture")}><Palette size={19} /><span><strong>Furniture</strong><small>Fridge, deep freezer, almirah, table</small></span></button><button type="button" className={photoType === "room" ? "selected" : ""} onClick={() => setPhotoType("room")}><LayoutPanelTop size={19} /><span><strong>Whole room</strong><small>Layout, wallpaper, frames & accents</small></span></button></div>
      <div className="decor-fields"><label>What is in the photo?<select value={subjectType} onChange={(event) => setSubjectType(event.target.value)}><option>Refrigerator / Fridge</option><option>Deep Freezer</option><option>Almirah / Wardrobe</option><option>Table / Furniture surface</option><option>Wall / Wallpaper zone</option><option>Floor / 3D mat zone</option><option>Wallboard / Frame zone</option><option>Whole room layout</option><option>Other visible furniture</option></select></label><label>Preferred style<select value={stylePreference} onChange={(event) => setStylePreference(event.target.value)}><option value="Modern elegant">Modern elegant</option><option value="Classic warm">Classic warm</option><option value="Minimal light">Minimal light</option><option value="Bold statement">Bold statement</option></select></label><label>Budget direction<select value={budgetPreference} onChange={(event) => setBudgetPreference(event.target.value)}><option value="Balanced">Balanced</option><option value="Essential">Essential</option><option value="Premium finish">Premium finish</option></select></label></div>
      <label className="decor-upload"><ImageUp size={25} /><span><strong>{fileName || "Choose a photo"}</strong><small>PNG, JPEG or WebP · maximum 8 MB</small></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectPhoto(event.target.files?.[0])} /></label>
      <label className="decor-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>আমি নিশ্চিত করছি যে এই photo ব্যবহারের অনুমতি আমার আছে এবং Mila-এর AI decor concept তৈরির জন্য ছবিটি server-side process করতে সম্মতি দিচ্ছি।</span></label>
      {error && <p className="decor-error"><CircleAlert size={17} /> {error}</p>}
      <button className="decor-analyze" type="submit" disabled={isBusy}>{analyze.isPending ? <><LoaderCircle size={18} className="spin" /> Analyzing your space…</> : <><Sparkles size={18} /> Get décor direction</>}</button>
      <p className="decor-privacy"><ShieldCheck size={17} /> ছবি database-এ raw data হিসেবে রাখা হয় না; একটি private storage reference ব্যবহার করা হয়।</p>
    </form>
    <aside className="decor-result" aria-live="polite">{isBusy && !recommendation ? <div className="decor-state"><LoaderCircle className="spin" size={34} /><h2>Reading your photo</h2><p>একটু সময় দিন—আপনার room বা furniture-এর জন্য সাজেশন তৈরি হচ্ছে।</p></div> : recommendation && report ? <div className="decor-report"><div className="decor-report-top"><span>02 · DECOR DIRECTION</span><h2>{recommendation.detectedSubject}</h2><p>{recommendation.spaceSummary}</p></div><div className="decor-report-style"><small>STYLE DIRECTION</small><strong>{recommendation.styleDirection}</strong><div>{recommendation.palette.map((color) => <span key={color}>{color}</span>)}</div></div><div className="decor-actions">{recommendation.recommendedActions.map((action) => <article key={`${action.area}-${action.title}`}><small>{action.priority} · {action.area}</small><h3>{action.title}</h3><p>{action.detail}</p></article>)}</div><div className="decor-recommendation-grid"><p><b>Sticker / surface</b>{recommendation.stickerSuggestion.material} · {recommendation.stickerSuggestion.finish}<br />{recommendation.stickerSuggestion.placement}</p><p><b>Wallpaper</b>{recommendation.wallpaperSuggestion.material}<br />{recommendation.wallpaperSuggestion.placement}</p><p><b>Furniture layout</b>{recommendation.furniturePlacement}</p><p><b>Frames & accents</b>{recommendation.frameAndAccentPlan}</p></div><div className="decor-image-tabs"><button type="button" className={activeImage === "source" ? "active" : ""} onClick={() => setActiveImage("source")}>Your photo</button><button type="button" disabled={!report.generatedPreviewUrl} className={activeImage === "concept" ? "active" : ""} onClick={() => setActiveImage("concept")}>Concept preview</button></div><div className="decor-image-view">{activeImage === "concept" && report.generatedPreviewUrl ? <img src={report.generatedPreviewUrl} alt="AI-generated conceptual decor preview" /> : photoDataUrl ? <img src={photoDataUrl} alt="Customer-selected room or furniture" /> : <p>Your selected photo remains visible in this browser session.</p>}</div>{!report.generatedPreviewUrl && <button className="decor-generate" type="button" onClick={() => void handleGeneratePreview()} disabled={isBusy}>{generatePreview.isPending ? <><LoaderCircle className="spin" size={18} /> Creating concept…</> : <><WandSparkles size={18} /> Create visual concept</>}</button>}<div className="decor-disclaimer"><ShieldCheck size={17} /><div><b>Conceptual visual only</b><p>{recommendation.safetyNotice}</p></div></div><p className="decor-assumptions">Assumptions: {recommendation.assumptions.join(" · ")}</p></div> : <div className="decor-state"><Sparkles size={34} /><h2>Your décor direction, in one place.</h2><p>Photo, style ও budget direction দিলে এখানে sticker, wallpaper, layout এবং accent-এর ধারণা পাবেন।</p></div>}</aside></section>
    <section className="decor-help"><div><span>NEED HUMAN GUIDANCE?</span><h2>Ready to make it<br /><em>real?</em></h2></div><p>AI preview একটি creative direction। final measurement, material selection ও installation-এর আগে Mila team-এর সঙ্গে কথা বলুন।</p><a href="https://wa.me/8801404225856" target="_blank" rel="noreferrer">Discuss on WhatsApp</a></section>
  </main><SiteFooter /><FloatingWhatsApp /></div>;
}
