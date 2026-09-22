import { and, desc, eq, gte, like, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { DecorPreview, FinanceTransaction, InsertDecorPreview, InsertFinanceRecurringProfile, InsertFinanceTransaction, InsertManualOrder, InsertUser, InsertWebsiteSetting, ManualOrder, WebsiteSetting, decorPreviews, financeRecurringProfiles, financeTransactions, manualOrders, users, websiteSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'super_admin';
      updateSet.role = 'super_admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listPublicWebsiteSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(websiteSettings).where(eq(websiteSettings.isPublic, 1));
  return Object.fromEntries(rows.map((row) => [row.settingKey, row.settingValue]));
}

export async function listWebsiteSettings(): Promise<WebsiteSetting[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(websiteSettings).orderBy(websiteSettings.settingKey);
}

export async function upsertWebsiteSetting(setting: Pick<InsertWebsiteSetting, "settingKey" | "settingValue" | "isPublic" | "updatedBy">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const dbSetting = { ...setting, isPublic: setting.isPublic ? 1 : 0 };
  await db.insert(websiteSettings).values(dbSetting).onDuplicateKeyUpdate({
    set: { settingValue: setting.settingValue, isPublic: dbSetting.isPublic, updatedBy: setting.updatedBy, updatedAt: new Date() },
  });
  const rows = await db.select().from(websiteSettings).where(eq(websiteSettings.settingKey, setting.settingKey)).limit(1);
  return rows[0];
}

export type ManualOrderFilters = {
  search?: string;
  status?: "new" | "confirmed" | "processing" | "delivered" | "cancelled";
  paymentStatus?: "unpaid" | "partial" | "paid";
  source?: "website" | "phone" | "whatsapp" | "walk_in";
  deliveryMode?: "home" | "courier" | "pickup";
};

export type OrderExportRow = Record<string, string | number>;

const normalizeExportCell = (value: unknown) => String(value ?? "").replace(/\r?\n/g, " | ");
const csvCell = (value: unknown) => normalizeExportCell(value).replace(/"/g, '""');

export function createOrderExportRows(orders: ManualOrder[]): OrderExportRow[] {
  return orders.map((order) => ({
    order_id: order.orderNumber,
    business_order_id: order.businessOrderId ?? "",
    created_at: order.createdAt.toISOString(),
    status: order.status,
    product_category: order.productSummary,
    product_code: order.productCode ?? "",
    selected_designs: normalizeExportCell(order.selectedDesigns),
    sticker_measurements: normalizeExportCell(order.stickerMeasurements),
    quality: order.stickerType ?? "",
    calculated_square_feet: order.calculatedSquareFeet ?? "",
    unit_price: order.unitPrice ?? "",
    delivery_mode: order.deliveryMode,
    delivery_option: order.deliveryOption ?? "",
    delivery_charge: order.deliveryCharge,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail ?? "",
    district: order.district ?? "",
    police_station: order.policeStation ?? "",
    locality: order.locality ?? "",
    delivery_address: normalizeExportCell(order.deliveryAddress),
    special_instructions: normalizeExportCell(order.serviceSpecifications),
    preferred_service_time: order.preferredServiceTime ?? "",
    assigned_staff: order.assignedTo ?? "",
    follow_up_at: order.followUpAt ? order.followUpAt.toISOString() : "",
    complaint_note: normalizeExportCell(order.complaintNote),
    payment_provider: order.paymentProvider ?? order.paymentMethod,
    payment_reference: order.paymentReference ?? "",
    payment_status: order.paymentStatus,
    order_value: order.orderValue,
    prepayment_amount: order.prepaymentAmount,
  }));
}

export function createOrderCsv(orders: ManualOrder[]): string {
  const rows = createOrderExportRows(orders);
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => `"${csvCell(row[header])}"`).join(","))].join("\n");
}

export function normalizePhoneNumber(value: string) {
  const banglaDigits = "০১২৩৪৫৬৭৮৯";
  return value
    .trim()
    .replace(/[০-৯]/g, (digit) => String(banglaDigits.indexOf(digit)))
    .replace(/[^\d]/g, "");
}

export async function createManualOrder(order: InsertManualOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(manualOrders).values(order);
  const result = await db.select().from(manualOrders).where(eq(manualOrders.orderNumber, order.orderNumber)).limit(1);
  return result[0];
}

export async function listManualOrders(filters: ManualOrderFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const conditions = [];
  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;
    conditions.push(or(like(manualOrders.orderNumber, search), like(manualOrders.businessOrderId, search), like(manualOrders.customerName, search), like(manualOrders.customerPhone, search)));
  }
  if (filters.status) conditions.push(eq(manualOrders.status, filters.status));
  if (filters.paymentStatus) conditions.push(eq(manualOrders.paymentStatus, filters.paymentStatus));
  if (filters.source) conditions.push(eq(manualOrders.source, filters.source));
  if (filters.deliveryMode) conditions.push(eq(manualOrders.deliveryMode, filters.deliveryMode));

  return db.select().from(manualOrders).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(manualOrders.createdAt));
}

/** Returns an order only when the customer presents the matching full phone number. */
export async function findManualOrderForCustomer(orderNumber: string, customerPhone: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db
    .select()
    .from(manualOrders)
    .where(and(or(eq(manualOrders.orderNumber, orderNumber), eq(manualOrders.businessOrderId, orderNumber)), eq(manualOrders.customerPhone, customerPhone)))
    .limit(1);
  return result[0];
}

export async function getManualOrderSummary() {
  const orders = await listManualOrders();
  return orders.reduce(
    (summary, order) => {
      const value = Number(order.orderValue ?? 0) + Number(order.deliveryCharge ?? 0);
      const paid = Number(order.prepaymentAmount ?? 0);
      summary.totalOrders += 1;
      summary.totalOrderValue += value;
      summary.totalPrepayment += paid;
      summary.totalDueBalance += Math.max(value - paid, 0);
      if (order.status === "delivered") summary.deliveredOrders += 1;
      return summary;
    },
    { totalOrders: 0, totalPrepayment: 0, totalDueBalance: 0, totalOrderValue: 0, deliveredOrders: 0 }
  );
}

export async function updateManualOrderStatus(
  orderNumber: string,
  updates: Partial<Pick<InsertManualOrder, "status" | "paymentMethod" | "paymentStatus" | "prepaymentAmount" | "deliveryCharge" | "deliveryMode" | "preferredServiceTime" | "assignedTo" | "internalNotes" | "complaintNote" | "followUpAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(manualOrders).set(updates).where(eq(manualOrders.orderNumber, orderNumber));
  const result = await db.select().from(manualOrders).where(eq(manualOrders.orderNumber, orderNumber)).limit(1);
  return result[0];
}

export async function createDecorPreview(preview: InsertDecorPreview) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(decorPreviews).values(preview);
  return getDecorPreviewByRequestId(preview.requestId);
}

export async function getDecorPreviewByRequestId(requestId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(decorPreviews).where(eq(decorPreviews.requestId, requestId)).limit(1);
  return result[0];
}

export async function updateDecorPreview(
  requestId: string,
  updates: Partial<Pick<InsertDecorPreview, "status" | "recommendationJson" | "generatedPreviewKey" | "errorMessage">>,
): Promise<DecorPreview | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(decorPreviews).set(updates).where(eq(decorPreviews.requestId, requestId));
  return getDecorPreviewByRequestId(requestId);
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { start, end };
}

export async function createFinanceTransaction(entry: InsertFinanceTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(financeTransactions).values(entry);
  const result = await db.select().from(financeTransactions).where(eq(financeTransactions.transactionId, entry.transactionId)).limit(1);
  return result[0];
}

export async function createFinanceTransactionWithRecurringProfile(
  entry: InsertFinanceTransaction,
  profile: InsertFinanceRecurringProfile,
): Promise<FinanceTransaction | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.transaction(async (tx) => {
    await tx.insert(financeRecurringProfiles).values(profile);
    await tx.insert(financeTransactions).values(entry);
  });
  const result = await db.select().from(financeTransactions).where(eq(financeTransactions.transactionId, entry.transactionId)).limit(1);
  return result[0];
}

export type FinanceListFilters = { category?: string; paymentMethod?: string };

export async function listFinanceTransactions(month: string, filters: FinanceListFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { start, end } = monthBounds(month);
  const conditions = [gte(financeTransactions.transactionDate, start), lt(financeTransactions.transactionDate, end)];
  if (filters.category) conditions.push(eq(financeTransactions.category, filters.category as typeof financeTransactions.category.enumValues[number]));
  if (filters.paymentMethod) conditions.push(eq(financeTransactions.paymentMethod, filters.paymentMethod as typeof financeTransactions.paymentMethod.enumValues[number]));
  return db.select().from(financeTransactions).where(and(...conditions)).orderBy(desc(financeTransactions.transactionDate), desc(financeTransactions.createdAt));
}

export function summarizeFinanceEntries(
  entries: Array<{ entryType: "revenue" | "expense"; category: string; amount: string | number | null }>,
  month: string,
) {
  const categories = new Map<string, { category: string; revenue: number; expense: number; count: number }>();
  let totalRevenue = 0;
  let totalExpense = 0;
  for (const entry of entries) {
    const amount = Number(entry.amount ?? 0);
    if (entry.entryType === "revenue") totalRevenue += amount;
    else totalExpense += amount;
    const current = categories.get(entry.category) ?? { category: entry.category, revenue: 0, expense: 0, count: 0 };
    if (entry.entryType === "revenue") current.revenue += amount;
    else current.expense += amount;
    current.count += 1;
    categories.set(entry.category, current);
  }
  return {
    month,
    entryCount: entries.length,
    totalRevenue,
    totalExpense,
    netProfitLoss: totalRevenue - totalExpense,
    categories: Array.from(categories.values()).sort((a, b) => Math.max(b.revenue, b.expense) - Math.max(a.revenue, a.expense)),
  };
}

export async function getFinanceSummary(month: string, filters: FinanceListFilters = {}) {
  return summarizeFinanceEntries(await listFinanceTransactions(month, filters), month);
}

export function getPendingRecurringProfiles<T extends { recurringProfileId: string }>(
  profiles: T[],
  existingProfileIds: Iterable<string | null | undefined>,
) {
  const existing = new Set(Array.from(existingProfileIds).filter((value): value is string => Boolean(value)));
  return profiles.filter((profile) => !existing.has(profile.recurringProfileId));
}

export async function carryForwardRecurringFinanceEntries(month: string, nextTransactionId: () => string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { start, end } = monthBounds(month);
  const profiles = await db.select().from(financeRecurringProfiles).where(and(eq(financeRecurringProfiles.status, "active"), lt(financeRecurringProfiles.startDate, end)));
  const currentEntries = await listFinanceTransactions(month);
  const pendingProfiles = getPendingRecurringProfiles(profiles, currentEntries.map((entry) => entry.recurringProfileId));
  if (!pendingProfiles.length) return { created: 0 };

  await db.transaction(async (tx) => {
    await tx.insert(financeTransactions).values(pendingProfiles.map((profile) => ({
      transactionId: nextTransactionId(),
      transactionDate: start,
      entryType: profile.entryType,
      category: profile.category,
      platform: profile.platform,
      campaign: profile.campaign,
      counterparty: profile.counterparty,
      referenceId: profile.referenceId,
      paymentMethod: profile.paymentMethod,
      recurrence: "monthly" as const,
      recurringProfileId: profile.recurringProfileId,
      amount: profile.amount,
      description: profile.description,
    })));
  });
  return { created: pendingProfiles.length };
}
