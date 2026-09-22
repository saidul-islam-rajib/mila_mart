import { CircleAlert, Landmark, Plus, ReceiptText, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type LedgerInput = {
  transactionDate: string;
  entryType: "revenue" | "expense";
  category: "advertising" | "salary" | "product_cost" | "materials" | "packaging" | "rent" | "courier" | "service_income" | "digital_payment" | "other";
  platform: string;
  campaign: string;
  counterparty: string;
  referenceId: string;
  paymentMethod: "cash" | "bkash" | "nagad" | "rocket" | "bank" | "card" | "pathao" | "other";
  recurrence: "none" | "monthly";
  amount: number;
  description: string;
};

const categoryLabels: Record<LedgerInput["category"], string> = {
  advertising: "Advertising & campaign",
  salary: "Salary / payroll",
  product_cost: "Product purchase cost",
  materials: "Materials · tape / vinyl / etc.",
  packaging: "Packaging · carton / supplies",
  rent: "Rent / utilities",
  courier: "Courier / Pathao",
  service_income: "Service income",
  digital_payment: "Digital payment received",
  other: "Other",
};

const paymentLabels: Record<LedgerInput["paymentMethod"], string> = { cash: "Cash", bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank: "Bank transfer", card: "Card", pathao: "Pathao", other: "Other" };
const money = (value: number | string) => `৳ ${Number(value).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);

function LedgerEntryForm({ onDone }: { onDone: () => void }) {
  const utils = trpc.useUtils();
  const form = useForm<LedgerInput>({ defaultValues: { transactionDate: new Date().toISOString().slice(0, 10), entryType: "expense", category: "advertising", platform: "", campaign: "", counterparty: "", referenceId: "", paymentMethod: "cash", recurrence: "none", amount: 0, description: "" } });
  const createEntry = trpc.finance.create.useMutation({ onSuccess: () => { utils.finance.summary.invalidate(); utils.finance.list.invalidate(); form.reset({ ...form.getValues(), amount: 0, platform: "", campaign: "", counterparty: "", referenceId: "", description: "" }); onDone(); } });
  const onSubmit = form.handleSubmit((data) => createEntry.mutate({ ...data, transactionDate: new Date(`${data.transactionDate}T12:00:00.000Z`) }));

  return <form className="finance-entry-form" onSubmit={onSubmit}><div className="finance-entry-head"><div><p>NEW LEDGER ENTRY</p><h2>Record income or expense.</h2></div><span>Records remain visible for audit; the form does not provide delete actions.</span></div><div className="finance-form-grid">
    <label>Date<input type="date" {...form.register("transactionDate", { required: true })} /></label><label>Entry type<select {...form.register("entryType")}><option value="expense">Expense / খরচ</option><option value="revenue">Revenue / আয়</option></select></label><label>Category<select {...form.register("category")}>{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label>Amount (৳)<input type="number" min="0.01" step="0.01" {...form.register("amount", { required: true, valueAsNumber: true, min: 0.01 })} /></label><label>Payment method<select {...form.register("paymentMethod")}>{Object.entries(paymentLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Recurring?<select {...form.register("recurrence")}><option value="none">One-time entry</option><option value="monthly">Monthly recurring reference</option></select></label>
    <label>Platform <small>e.g. Meta, Google, Pathao</small><input {...form.register("platform")} placeholder="Optional" /></label><label>Campaign / purpose<input {...form.register("campaign")} placeholder="Optional" /></label><label>Supplier / employee / payer<input {...form.register("counterparty")} placeholder="Optional" /></label>
    <label className="wide">Payment / invoice reference ID<input {...form.register("referenceId")} placeholder="Optional payment transaction or invoice ID" /></label><label className="wide">Details / description<textarea {...form.register("description", { required: true, minLength: 2 })} placeholder="What was this revenue or expense for?" /></label>
  </div>{createEntry.error && <p className="finance-form-error"><CircleAlert size={16} /> Entry could not be saved. Check the amount, date and details.</p>}<button className="finance-submit" type="submit" disabled={createEntry.isPending}>{createEntry.isPending ? "Saving entry…" : <><Plus size={17} /> Save ledger entry</>}</button></form>;
}

export default function AdminFinance() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState<LedgerInput["category"] | "">("");
  const [paymentFilter, setPaymentFilter] = useState<LedgerInput["paymentMethod"] | "">("");
  const canManage = user?.role === "admin" || user?.role === "super_admin";
  const input = useMemo(() => ({ month, category: categoryFilter || undefined, paymentMethod: paymentFilter || undefined }), [month, categoryFilter, paymentFilter]);
  const summary = trpc.finance.summary.useQuery(input, { enabled: canManage });
  const entries = trpc.finance.list.useQuery(input, { enabled: canManage });
  const utils = trpc.useUtils();
  const [carryMessage, setCarryMessage] = useState("");
  const carryForward = trpc.finance.carryForward.useMutation({ onSuccess: (result) => { setCarryMessage(result.created ? `${result.created} recurring entry added for ${month}.` : "All active recurring entries are already recorded for this month."); utils.finance.summary.invalidate(input); utils.finance.list.invalidate(input); } });
  const data = summary.data;
  const categoryRows = data?.categories ?? [];
  const maximum = Math.max(...categoryRows.map((row) => Math.max(row.revenue, row.expense)), 1);

  return <DashboardLayout>{!canManage ? <section className="admin-access"><p>MILA ADMIN</p><h1>Owner access required</h1><span>Finance ledger কেবল অনুমোদিত Mila administrator দেখতে ও নতুন entry যোগ করতে পারেন।</span></section> : <div className="mila-finance"><header className="finance-header"><div><p>MILA FINANCE & OPERATIONS</p><h1>Every recorded taka, <em>in context.</em></h1><span>Revenue, expense, campaign, salary, materials, Pathao/courier, payment reference এবং month-by-month operating result এক জায়গায় রাখুন।</span></div><div className="finance-header-actions"><label>Reporting month<input type="month" value={month} onChange={(event) => { setMonth(event.target.value || currentMonth()); setCarryMessage(""); }} /></label><button type="button" onClick={() => carryForward.mutate({ month })} disabled={carryForward.isPending}>{carryForward.isPending ? "Carrying forward…" : "Add monthly recurring entries"}</button></div></header>
    <section className="finance-disclaimer"><Landmark size={20} /><p>Management ledger only: recorded income − recorded expense = net result. এটি tax filing, statutory accounting বা audit report নয়।{carryMessage && <><br /><b>{carryMessage}</b></>}</p></section>
    <section className="finance-filters" aria-label="Finance filters"><label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as LedgerInput["category"] | "")}><option value="">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Payment channel<select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as LedgerInput["paymentMethod"] | "")}><option value="">All channels</option>{Object.entries(paymentLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button type="button" onClick={() => { setCategoryFilter(""); setPaymentFilter(""); }}>Clear filters</button></section>
    <section className="finance-stats"><article><span>RECORDED REVENUE</span><strong>{money(data?.totalRevenue ?? 0)}</strong><small>{data?.entryCount ?? 0} entries in {month}</small><TrendingUp size={22} /></article><article><span>RECORDED EXPENSE</span><strong>{money(data?.totalExpense ?? 0)}</strong><small>Only actual saved entries are included</small><TrendingDown size={22} /></article><article className={(data?.netProfitLoss ?? 0) < 0 ? "negative" : "positive"}><span>NET PROFIT / LOSS</span><strong>{money(data?.netProfitLoss ?? 0)}</strong><small>Revenue minus expense</small><WalletCards size={22} /></article></section>
    <section className="finance-main-grid"><div><LedgerEntryForm onDone={() => undefined} /><section className="finance-ledger"><div className="finance-section-head"><div><p>MONTHLY LEDGER</p><h2>Recorded entries</h2></div><ReceiptText size={25} /></div>{entries.isLoading ? <p className="finance-empty">Loading records…</p> : entries.data?.length ? <div className="finance-table"><div className="finance-table-row finance-table-head"><span>Date</span><span>Type</span><span>Details</span><span>Reference</span><span>Amount</span></div>{entries.data.map((entry) => <div className="finance-table-row" key={entry.transactionId}><span>{new Date(entry.transactionDate).toLocaleDateString("en-GB")}</span><span><b className={entry.entryType}>{entry.entryType}</b><small>{categoryLabels[entry.category as LedgerInput["category"]]}</small></span><span><strong>{entry.description}</strong><small>{[entry.platform, entry.campaign, entry.counterparty].filter(Boolean).join(" · ") || "No optional metadata"}</small></span><span>{entry.referenceId || "—"}<small>{paymentLabels[entry.paymentMethod as LedgerInput["paymentMethod"]]}{entry.recurrence === "monthly" ? " · monthly" : ""}</small></span><strong className={entry.entryType}>{entry.entryType === "expense" ? "− " : "+ "}{money(entry.amount)}</strong></div>)}</div> : <p className="finance-empty">এই মাসে এখনো কোনো ledger entry নেই। বাস্তব আয়/খরচ যোগ করলে এখানে monthly record তৈরি হবে।</p>}</section></div>
      <aside className="finance-breakdown"><div className="finance-section-head"><div><p>CATEGORY VIEW</p><h2>Where money moved</h2></div><WalletCards size={24} /></div>{categoryRows.length ? <div className="finance-bars">{categoryRows.map((row) => <div className="finance-bar-row" key={row.category}><div><span>{categoryLabels[row.category as LedgerInput["category"]]}</span><small>{money(row.revenue)} in · {money(row.expense)} out</small></div><div className="finance-bar-track"><i className="revenue" style={{ width: `${(row.revenue / maximum) * 100}%` }} /><i className="expense" style={{ width: `${(row.expense / maximum) * 100}%` }} /></div></div>)}</div> : <p className="finance-empty">No recorded category data yet.</p>}<div className="finance-rule"><b>How this stays reliable</b><p>প্রতিটি income বা expense একবারে তার date, category ও payment reference-সহ যোগ করুন। ভুল হলে নতুন corrective entry দিন, পুরনো record মুছবেন না।</p></div></aside></section>
  </div>}</DashboardLayout>;
}
