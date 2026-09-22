import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PencilLine, ShieldCheck } from "lucide-react";

const commonSettings = [
  ["hero_kicker", "Hero eyebrow", "INTERIORS · SURFACE MAKEOVERS · HOME LIVING"],
  ["hero_headline", "Hero headline", "Your space, made personal."],
  ["hero_helper", "Hero helper copy", "Choose a design, share your measurements and receive a clear quote."],
  ["contact_phone", "Public contact phone", "+880 1404 225856"],
  ["contact_email", "Public contact email", "milamartbd@gmail.com"],
  ["facebook_url", "Facebook link", "https://www.facebook.com/search/top?q=mila%20interior%20solutions"],
  ["telegram_url", "Telegram link", "https://t.me/+uBztsb6V_dlhZWY1"],
  ["payment_notice", "Payment instruction notice", "Advance payment instructions are shared after order review."],
  ["visibility_stickers", "All Stickers visibility", "visible"],
  ["visibility_wallpapers", "Wall Papers visibility", "visible"],
  ["visibility_fashion", "Fashion visibility", "visible"],
  ["visibility_new_arrivals", "New Arrivals visibility", "visible"],
  ["visibility_ai_decor", "AI Decor visibility", "visible"],
] as const;

export default function AdminWebsiteManagement() {
  const { user } = useAuth();
  const [activeKey, setActiveKey] = useState<string>(commonSettings[0][0]);
  const [value, setValue] = useState<string>(commonSettings[0][2]);
  const [isPublic, setIsPublic] = useState(true);
  const canManage = user?.role === "super_admin" || user?.role === "admin";
  const utils = trpc.useUtils();
  const settings = trpc.site.list.useQuery(undefined, { enabled: canManage });
  const save = trpc.site.save.useMutation({ onSuccess: () => { utils.site.list.invalidate(); utils.site.publicSettings.invalidate(); } });
  const openSetting = (key: string, fallback: string) => { const saved = settings.data?.find((item) => item.settingKey === key); setActiveKey(key); setValue(saved?.settingValue ?? fallback); setIsPublic(saved ? Boolean(saved.isPublic) : true); };

  return <DashboardLayout>{!canManage ? <section className="admin-access"><p>WEBSITE MANAGEMENT</p><h1>Super-admin access required</h1><span>Only the primary owner account can edit public website copy and contact information.</span></section> : <div className="mila-finance site-management"><header className="finance-header"><div><p>WEBSITE MANAGEMENT</p><h1>Control public copy, <em>with care.</em></h1><span>Update headline, customer helper copy and public contact information from this protected owner-only desk.</span></div></header><section className="finance-disclaimer"><ShieldCheck size={20} /><p>Changes become visible on the public website. Keep product pricing, bank details and customer information out of public copy.</p></section><section className="site-management-grid"><aside><p>COMMON CONTROLS</p>{commonSettings.map(([key, label, fallback]) => <button key={key} type="button" className={activeKey === key ? "active" : ""} onClick={() => openSetting(key, fallback)}>{label}</button>)}</aside><form onSubmit={(event) => { event.preventDefault(); save.mutate({ settingKey: activeKey, settingValue: value, isPublic }); }}><p>EDIT PUBLIC SETTING</p><h2>{commonSettings.find(([key]) => key === activeKey)?.[1] ?? activeKey}</h2><label>Setting key<input value={activeKey} onChange={(event) => setActiveKey(event.target.value)} /></label><label>Public value<textarea value={value} onChange={(event) => setValue(event.target.value)} /></label><label className="site-public-toggle"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Show this value on the public website</label>{save.error && <small className="finance-form-error">Setting could not be saved. Check the key and public value.</small>}<button className="finance-submit" type="submit" disabled={save.isPending}><PencilLine size={16} /> {save.isPending ? "Saving…" : "Save public setting"}</button></form></section><section className="site-settings-list"><p>SAVED SETTINGS</p>{settings.data?.length ? settings.data.map((item) => <article key={item.settingKey}><strong>{item.settingKey}</strong><span>{item.isPublic ? "Public" : "Internal"}</span><small>{item.settingValue}</small></article>) : <small>No custom public setting saved yet. Select a common control above to begin.</small>}</section></div>}</DashboardLayout>;
}
