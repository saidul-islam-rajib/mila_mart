// server/_core/app.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { and, desc, eq, gte, like, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "moderator", "admin", "super_admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var manualOrders = mysqlTable("manualOrders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  businessOrderId: varchar("businessOrderId", { length: 64 }).unique(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 40 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  deliveryAddress: text("deliveryAddress"),
  district: varchar("district", { length: 120 }),
  policeStation: varchar("policeStation", { length: 120 }),
  locality: varchar("locality", { length: 160 }),
  productCode: varchar("productCode", { length: 80 }),
  productSummary: text("productSummary").notNull(),
  selectedDesigns: text("selectedDesigns"),
  designSourceUrl: varchar("designSourceUrl", { length: 512 }),
  serviceSpecifications: text("serviceSpecifications"),
  stickerType: varchar("stickerType", { length: 80 }),
  stickerMeasurements: text("stickerMeasurements"),
  calculatedSquareFeet: decimal("calculatedSquareFeet", { precision: 12, scale: 2 }),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }),
  customSquareFeet: decimal("customSquareFeet", { precision: 12, scale: 2 }),
  dimensions: varchar("dimensions", { length: 200 }),
  quantity: int("quantity").notNull().default(1),
  unitLabel: varchar("unitLabel", { length: 30 }).notNull().default("pcs"),
  source: mysqlEnum("source", ["website", "phone", "whatsapp", "walk_in"]).notNull().default("phone"),
  deliveryMode: mysqlEnum("deliveryMode", ["home", "courier", "pickup"]).notNull().default("courier"),
  deliveryOption: varchar("deliveryOption", { length: 40 }),
  preferredServiceTime: varchar("preferredServiceTime", { length: 500 }),
  assignedTo: varchar("assignedTo", { length: 160 }),
  internalNotes: text("internalNotes"),
  complaintNote: text("complaintNote"),
  followUpAt: timestamp("followUpAt"),
  status: mysqlEnum("status", ["new", "confirmed", "processing", "delivered", "cancelled"]).notNull().default("new"),
  paymentMethod: mysqlEnum("paymentMethod", ["cod", "mobile_banking", "bank_transfer", "online_card", "other"]).notNull().default("cod"),
  paymentProvider: varchar("paymentProvider", { length: 80 }),
  paymentReference: varchar("paymentReference", { length: 160 }),
  paymentProofKey: varchar("paymentProofKey", { length: 512 }),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"]).notNull().default("unpaid"),
  orderValue: decimal("orderValue", { precision: 12, scale: 2 }).notNull(),
  deliveryCharge: decimal("deliveryCharge", { precision: 12, scale: 2 }).notNull().default("0.00"),
  prepaymentAmount: decimal("prepaymentAmount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  shopifyOrderId: varchar("shopifyOrderId", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var decorPreviews = mysqlTable("decorPreviews", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 64 }).notNull().unique(),
  sourceImageKey: varchar("sourceImageKey", { length: 512 }).notNull(),
  sourceImageMimeType: varchar("sourceImageMimeType", { length: 32 }).notNull(),
  photoType: mysqlEnum("photoType", ["furniture", "room"]).notNull(),
  subjectType: varchar("subjectType", { length: 80 }),
  stylePreference: varchar("stylePreference", { length: 80 }),
  budgetPreference: varchar("budgetPreference", { length: 80 }),
  consentedAt: timestamp("consentedAt").notNull(),
  status: mysqlEnum("status", ["uploaded", "analyzing", "ready", "generating", "complete", "failed"]).notNull().default("uploaded"),
  recommendationJson: text("recommendationJson"),
  generatedPreviewKey: varchar("generatedPreviewKey", { length: 512 }),
  errorMessage: varchar("errorMessage", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var financeTransactions = mysqlTable("financeTransactions", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: varchar("transactionId", { length: 48 }).notNull().unique(),
  transactionDate: timestamp("transactionDate").notNull(),
  entryType: mysqlEnum("entryType", ["revenue", "expense"]).notNull(),
  category: mysqlEnum("category", ["advertising", "salary", "product_cost", "materials", "packaging", "rent", "courier", "service_income", "digital_payment", "other"]).notNull(),
  platform: varchar("platform", { length: 120 }),
  campaign: varchar("campaign", { length: 160 }),
  counterparty: varchar("counterparty", { length: 160 }),
  referenceId: varchar("referenceId", { length: 160 }),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "bkash", "nagad", "rocket", "bank", "card", "pathao", "other"]).notNull().default("cash"),
  recurrence: mysqlEnum("recurrence", ["none", "monthly"]).notNull().default("none"),
  recurringProfileId: varchar("recurringProfileId", { length: 48 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var financeRecurringProfiles = mysqlTable("financeRecurringProfiles", {
  id: int("id").autoincrement().primaryKey(),
  recurringProfileId: varchar("recurringProfileId", { length: 48 }).notNull().unique(),
  entryType: mysqlEnum("entryType", ["revenue", "expense"]).notNull(),
  category: mysqlEnum("category", ["advertising", "salary", "product_cost", "materials", "packaging", "rent", "courier", "service_income", "digital_payment", "other"]).notNull(),
  platform: varchar("platform", { length: 120 }),
  campaign: varchar("campaign", { length: 160 }),
  counterparty: varchar("counterparty", { length: 160 }),
  referenceId: varchar("referenceId", { length: 160 }),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "bkash", "nagad", "rocket", "bank", "card", "pathao", "other"]).notNull().default("cash"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  startDate: timestamp("startDate").notNull(),
  status: mysqlEnum("status", ["active", "paused"]).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var websiteSettings = mysqlTable("websiteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 80 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  isPublic: tinyint("isPublic").notNull().default(1),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  updatedBy: varchar("updatedBy", { length: 128 })
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  shopifyStoreDomain: process.env.SHOPIFY_STORE_DOMAIN ?? "",
  shopifyStorefrontApiAccessToken: process.env.SHOPIFY_STOREFRONT_API_ACCESS_TOKEN ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "super_admin";
      updateSet.role = "super_admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function listPublicWebsiteSettings() {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(websiteSettings).where(eq(websiteSettings.isPublic, 1));
  return Object.fromEntries(rows.map((row) => [row.settingKey, row.settingValue]));
}
async function listWebsiteSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(websiteSettings).orderBy(websiteSettings.settingKey);
}
async function upsertWebsiteSetting(setting) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const dbSetting = { ...setting, isPublic: setting.isPublic ? 1 : 0 };
  await db.insert(websiteSettings).values(dbSetting).onDuplicateKeyUpdate({
    set: { settingValue: setting.settingValue, isPublic: dbSetting.isPublic, updatedBy: setting.updatedBy, updatedAt: /* @__PURE__ */ new Date() }
  });
  const rows = await db.select().from(websiteSettings).where(eq(websiteSettings.settingKey, setting.settingKey)).limit(1);
  return rows[0];
}
var normalizeExportCell = (value) => String(value ?? "").replace(/\r?\n/g, " | ");
var csvCell = (value) => normalizeExportCell(value).replace(/"/g, '""');
function createOrderExportRows(orders) {
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
    prepayment_amount: order.prepaymentAmount
  }));
}
function createOrderCsv(orders) {
  const rows = createOrderExportRows(orders);
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => `"${csvCell(row[header])}"`).join(","))].join("\n");
}
function normalizePhoneNumber(value) {
  const banglaDigits = "\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF";
  return value.trim().replace(/[০-৯]/g, (digit) => String(banglaDigits.indexOf(digit))).replace(/[^\d]/g, "");
}
async function createManualOrder(order) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(manualOrders).values(order);
  const result = await db.select().from(manualOrders).where(eq(manualOrders.orderNumber, order.orderNumber)).limit(1);
  return result[0];
}
async function listManualOrders(filters = {}) {
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
  return db.select().from(manualOrders).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(manualOrders.createdAt));
}
async function findManualOrderForCustomer(orderNumber, customerPhone) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(manualOrders).where(and(or(eq(manualOrders.orderNumber, orderNumber), eq(manualOrders.businessOrderId, orderNumber)), eq(manualOrders.customerPhone, customerPhone))).limit(1);
  return result[0];
}
async function getManualOrderSummary() {
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
async function updateManualOrderStatus(orderNumber, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(manualOrders).set(updates).where(eq(manualOrders.orderNumber, orderNumber));
  const result = await db.select().from(manualOrders).where(eq(manualOrders.orderNumber, orderNumber)).limit(1);
  return result[0];
}
async function createDecorPreview(preview) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(decorPreviews).values(preview);
  return getDecorPreviewByRequestId(preview.requestId);
}
async function getDecorPreviewByRequestId(requestId) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(decorPreviews).where(eq(decorPreviews.requestId, requestId)).limit(1);
  return result[0];
}
async function updateDecorPreview(requestId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(decorPreviews).set(updates).where(eq(decorPreviews.requestId, requestId));
  return getDecorPreviewByRequestId(requestId);
}
function monthBounds(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { start, end };
}
async function createFinanceTransaction(entry) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(financeTransactions).values(entry);
  const result = await db.select().from(financeTransactions).where(eq(financeTransactions.transactionId, entry.transactionId)).limit(1);
  return result[0];
}
async function createFinanceTransactionWithRecurringProfile(entry, profile) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.transaction(async (tx) => {
    await tx.insert(financeRecurringProfiles).values(profile);
    await tx.insert(financeTransactions).values(entry);
  });
  const result = await db.select().from(financeTransactions).where(eq(financeTransactions.transactionId, entry.transactionId)).limit(1);
  return result[0];
}
async function listFinanceTransactions(month, filters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { start, end } = monthBounds(month);
  const conditions = [gte(financeTransactions.transactionDate, start), lt(financeTransactions.transactionDate, end)];
  if (filters.category) conditions.push(eq(financeTransactions.category, filters.category));
  if (filters.paymentMethod) conditions.push(eq(financeTransactions.paymentMethod, filters.paymentMethod));
  return db.select().from(financeTransactions).where(and(...conditions)).orderBy(desc(financeTransactions.transactionDate), desc(financeTransactions.createdAt));
}
function summarizeFinanceEntries(entries, month) {
  const categories = /* @__PURE__ */ new Map();
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
    categories: Array.from(categories.values()).sort((a, b) => Math.max(b.revenue, b.expense) - Math.max(a.revenue, a.expense))
  };
}
async function getFinanceSummary(month, filters = {}) {
  return summarizeFinanceEntries(await listFinanceTransactions(month, filters), month);
}
function getPendingRecurringProfiles(profiles, existingProfileIds) {
  const existing = new Set(Array.from(existingProfileIds).filter((value) => Boolean(value)));
  return profiles.filter((profile) => !existing.has(profile.recurringProfileId));
}
async function carryForwardRecurringFinanceEntries(month, nextTransactionId) {
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
      recurrence: "monthly",
      recurringProfileId: profile.recurringProfileId,
      amount: profile.amount,
      description: profile.description
    })));
  });
  return { created: pendingProfiles.length };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}
async function storageGet(relKey) {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}
async function storageGetSignedUrl(relKey) {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);
  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }
  const { url } = await resp.json();
  return url;
}

// server/paymentProof.ts
var MAX_FILE_BYTES = 4 * 1024 * 1024;
var WINDOW_MS = 10 * 60 * 1e3;
var MAX_UPLOADS_PER_WINDOW = 5;
var attempts = /* @__PURE__ */ new Map();
function acceptUpload(ip) {
  const now = Date.now();
  const current = (attempts.get(ip) ?? []).filter((timestamp2) => timestamp2 > now - WINDOW_MS);
  if (current.length >= MAX_UPLOADS_PER_WINDOW) return false;
  current.push(now);
  attempts.set(ip, current);
  return true;
}
function decodeProof(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_FILE_BYTES) return null;
  return { buffer, subtype: match[1], contentType: `image/${match[1]}` };
}
function registerPaymentProofRoutes(app) {
  app.post("/api/payment-proof", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!acceptUpload(ip)) return res.status(429).json({ error: "Too many uploads. Please try again later." });
    const proof = decodeProof(req.body?.dataUrl);
    if (!proof) return res.status(400).json({ error: "Upload a PNG, JPEG, or WebP image smaller than 4 MB." });
    try {
      const { key } = await storagePut(`payment-proofs/${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}/proof.${proof.subtype}`, proof.buffer, proof.contentType);
      return res.status(201).json({ key });
    } catch (error) {
      console.error("[Payment proof] upload failed", error);
      return res.status(500).json({ error: "Payment proof could not be uploaded. Please retry." });
    }
  });
}

// server/decorUpload.ts
import { randomUUID } from "node:crypto";
var MAX_FILE_BYTES2 = 8 * 1024 * 1024;
var WINDOW_MS2 = 15 * 60 * 1e3;
var MAX_UPLOADS_PER_WINDOW2 = 3;
var attempts2 = /* @__PURE__ */ new Map();
function acceptUpload2(ip) {
  const now = Date.now();
  const current = (attempts2.get(ip) ?? []).filter((timestamp2) => timestamp2 > now - WINDOW_MS2);
  if (current.length >= MAX_UPLOADS_PER_WINDOW2) return false;
  current.push(now);
  attempts2.set(ip, current);
  return true;
}
function optionalText(value, maxLength) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || null;
}
function parseDecorUpload(body) {
  if (!body || typeof body !== "object") return null;
  const input = body;
  if (input.consent !== true) return null;
  if (input.photoType !== "furniture" && input.photoType !== "room") return null;
  if (typeof input.dataUrl !== "string") return null;
  const match = input.dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_FILE_BYTES2) return null;
  const extension = match[1];
  return {
    buffer,
    contentType: `image/${extension}`,
    extension,
    photoType: input.photoType,
    subjectType: optionalText(input.subjectType, 80),
    stylePreference: optionalText(input.stylePreference, 80),
    budgetPreference: optionalText(input.budgetPreference, 80)
  };
}
function registerDecorPhotoRoutes(app) {
  app.post("/api/decor-photo", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!acceptUpload2(ip)) {
      return res.status(429).json({ error: "Too many photo uploads. Please try again in a few minutes." });
    }
    const upload = parseDecorUpload(req.body);
    if (!upload) {
      return res.status(400).json({ error: "Upload a PNG, JPEG, or WebP photo smaller than 8 MB and confirm consent." });
    }
    const requestId = randomUUID();
    try {
      const { key } = await storagePut(
        `decor-source/${requestId}/source.${upload.extension}`,
        upload.buffer,
        upload.contentType
      );
      await createDecorPreview({
        requestId,
        sourceImageKey: key,
        sourceImageMimeType: upload.contentType,
        photoType: upload.photoType,
        subjectType: upload.subjectType,
        stylePreference: upload.stylePreference,
        budgetPreference: upload.budgetPreference,
        consentedAt: /* @__PURE__ */ new Date(),
        status: "uploaded"
      });
      return res.status(201).json({ requestId });
    } catch (error) {
      console.error("[Decor photo] upload failed", error instanceof Error ? error.message : "unknown error");
      return res.status(500).json({ error: "Your photo could not be prepared. Please retry." });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var isPrimaryOwner = (user) => Boolean(ENV.ownerOpenId && user.openId === ENV.ownerOpenId);
var staffProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || !["moderator", "admin", "super_admin"].includes(ctx.user.role)) {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || !["admin", "super_admin"].includes(ctx.user.role)) {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var superAdminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "super_admin" && !isPrimaryOwner(ctx.user)) {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/commerce.ts
import { z as z2 } from "zod";

// server/_core/shopify.ts
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/shopifyNormalize.ts
function normalizeMoney(m) {
  return { amount: m.amount, currencyCode: m.currencyCode };
}
function normalizeImage(i) {
  return { url: i.url, altText: i.altText ?? null, width: i.width, height: i.height };
}
function normalizeSelectedOption(o) {
  return { name: o.name, value: o.value };
}
function normalizeProductOption(o) {
  return { name: o.name, values: o.values };
}
function normalizeVariant(v) {
  return {
    id: v.id,
    title: v.title,
    price: normalizeMoney(v.price),
    compareAtPrice: v.compareAtPrice ? normalizeMoney(v.compareAtPrice) : null,
    availableForSale: v.availableForSale,
    selectedOptions: (v.selectedOptions ?? []).map(normalizeSelectedOption)
  };
}
function normalizeProduct(p) {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    descriptionHtml: p.descriptionHtml,
    productType: p.productType || null,
    vendor: p.vendor || null,
    tags: p.tags ?? [],
    images: p.images.edges.map((e) => normalizeImage(e.node)),
    priceRange: {
      min: normalizeMoney(p.priceRange.minVariantPrice),
      max: normalizeMoney(p.priceRange.maxVariantPrice)
    },
    options: (p.options ?? []).map(normalizeProductOption),
    variants: p.variants.edges.map((e) => normalizeVariant(e.node))
  };
}
function normalizeCollection(c) {
  return {
    id: c.id,
    handle: c.handle,
    title: c.title,
    description: c.description,
    image: c.image ? normalizeImage(c.image) : null
  };
}
function normalizeCartItem(line) {
  const img = line.merchandise.product.images.edges[0]?.node ?? null;
  return {
    lineId: line.id,
    variantId: line.merchandise.id,
    productHandle: line.merchandise.product.handle,
    productTitle: line.merchandise.product.title,
    variantTitle: line.merchandise.title,
    image: img ? normalizeImage(img) : null,
    unitPrice: normalizeMoney(line.merchandise.price),
    quantity: line.quantity,
    lineTotal: normalizeMoney(line.cost.totalAmount)
  };
}
function withChannelParam(checkoutUrl) {
  if (!checkoutUrl) return checkoutUrl;
  return checkoutUrl.includes("?") ? `${checkoutUrl}&channel=online_store` : `${checkoutUrl}?channel=online_store`;
}
function normalizeCart(c) {
  return {
    id: c.id,
    checkoutUrl: withChannelParam(c.checkoutUrl),
    items: c.lines.edges.map((e) => normalizeCartItem(e.node)),
    itemCount: c.totalQuantity,
    subtotal: normalizeMoney(c.cost.subtotalAmount),
    total: normalizeMoney(c.cost.totalAmount)
  };
}

// server/_core/shopify.ts
var SHOPIFY_API_VERSION = "2025-04";
function getShopifyStoreDomain() {
  return process.env.SHOPIFY_STORE_DOMAIN ?? "";
}
function getShopifyStorefrontToken() {
  return process.env.SHOPIFY_STOREFRONT_API_ACCESS_TOKEN ?? "";
}
function isShopifyConfigured() {
  return Boolean(getShopifyStoreDomain() && getShopifyStorefrontToken());
}
function shopifyStorefrontEndpoint() {
  return `https://${getShopifyStoreDomain()}/api/${SHOPIFY_API_VERSION}/graphql.json`;
}
async function storefrontFetch(query, variables) {
  if (!isShopifyConfigured()) {
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: "Shopify Storefront API is not configured"
    });
  }
  let response;
  try {
    response = await fetch(shopifyStorefrontEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": getShopifyStorefrontToken()
      },
      body: JSON.stringify({ query, variables })
    });
  } catch (err) {
    console.error("[Shopify] Network error", err);
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: "Shopify Storefront API is unreachable"
    });
  }
  if (!response.ok) {
    console.error(
      "[Shopify] HTTP",
      response.status,
      await response.text().catch(() => "")
    );
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: `Shopify Storefront API returned HTTP ${response.status}`
    });
  }
  const json = await response.json();
  if (json.errors && json.errors.length) {
    console.error("[Shopify] GraphQL errors", json.errors);
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: json.errors[0].message || "Shopify Storefront API error"
    });
  }
  if (!json.data) {
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: "Shopify Storefront API returned no data"
    });
  }
  return json.data;
}
function unwrapCart(payload, context) {
  if (payload.userErrors && payload.userErrors.length) {
    console.error(`[Shopify] ${context} userErrors`, payload.userErrors);
    throw new TRPCError3({
      code: "BAD_REQUEST",
      message: payload.userErrors[0].message || `Shopify ${context} failed`
    });
  }
  if (!payload.cart) {
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: `Shopify ${context} returned no cart`
    });
  }
  return normalizeCart(payload.cart);
}
var MONEY_FRAGMENT = (
  /* GraphQL */
  `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`
);
var IMAGE_FRAGMENT = (
  /* GraphQL */
  `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`
);
var VARIANT_FRAGMENT = (
  /* GraphQL */
  `
  ${MONEY_FRAGMENT}
  fragment VariantFields on ProductVariant {
    id
    title
    availableForSale
    price { ...MoneyFields }
    compareAtPrice { ...MoneyFields }
    selectedOptions { name value }
  }
`
);
var PRODUCT_FRAGMENT = (
  /* GraphQL */
  `
  ${IMAGE_FRAGMENT}
  ${VARIANT_FRAGMENT}
  fragment ProductFields on Product {
    id
    title
    handle
    description
    descriptionHtml
    productType
    vendor
    tags
    options { name values }
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    images(first: 8) {
      edges { node { ...ImageFields } }
    }
    variants(first: 25) {
      edges { node { ...VariantFields } }
    }
  }
`
);
var COLLECTION_FRAGMENT = (
  /* GraphQL */
  `
  ${IMAGE_FRAGMENT}
  fragment CollectionFields on Collection {
    id
    handle
    title
    description
    image { ...ImageFields }
  }
`
);
var CART_FRAGMENT = (
  /* GraphQL */
  `
  ${MONEY_FRAGMENT}
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount { ...MoneyFields }
      subtotalAmount { ...MoneyFields }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost { totalAmount { ...MoneyFields } }
          merchandise {
            ... on ProductVariant {
              id
              title
              price { ...MoneyFields }
              product {
                handle
                title
                images(first: 1) {
                  edges { node { url altText width height } }
                }
              }
            }
          }
        }
      }
    }
  }
`
);
async function listProducts(options = {}) {
  const first = options.first ?? 24;
  if (options.collectionHandle) {
    const data2 = await storefrontFetch(
      `${PRODUCT_FRAGMENT}
       query productsByCollection($handle: String!, $first: Int!) {
         collection(handle: $handle) {
           products(first: $first) {
             edges { node { ...ProductFields } }
           }
         }
       }`,
      { handle: options.collectionHandle, first }
    );
    if (!data2.collection) return [];
    return data2.collection.products.edges.map((e) => normalizeProduct(e.node));
  }
  const data = await storefrontFetch(
    `${PRODUCT_FRAGMENT}
     query listProducts($first: Int!) {
       products(first: $first, sortKey: TITLE) {
         edges { node { ...ProductFields } }
       }
     }`,
    { first }
  );
  return data.products.edges.map((e) => normalizeProduct(e.node));
}
async function getProductByHandle(handle) {
  const data = await storefrontFetch(
    `${PRODUCT_FRAGMENT}
     query productByHandle($handle: String!) {
       productByHandle(handle: $handle) { ...ProductFields }
     }`,
    { handle }
  );
  if (!data.productByHandle) {
    throw new TRPCError3({
      code: "NOT_FOUND",
      message: `Product "${handle}" not found`
    });
  }
  return normalizeProduct(data.productByHandle);
}
async function listCollections(first = 10) {
  const data = await storefrontFetch(
    `${COLLECTION_FRAGMENT}
     query listCollections($first: Int!) {
       collections(first: $first) {
         edges { node { ...CollectionFields } }
       }
     }`,
    { first }
  );
  return data.collections.edges.map((e) => normalizeCollection(e.node));
}
async function getCollectionByHandle(handle) {
  const data = await storefrontFetch(
    `${COLLECTION_FRAGMENT}
     query collectionByHandle($handle: String!) {
       collection(handle: $handle) { ...CollectionFields }
     }`,
    { handle }
  );
  if (!data.collection) {
    throw new TRPCError3({
      code: "NOT_FOUND",
      message: `Collection "${handle}" not found`
    });
  }
  return normalizeCollection(data.collection);
}
async function createCart(lines) {
  const data = await storefrontFetch(
    `${CART_FRAGMENT}
     mutation cartCreate($input: CartInput!) {
       cartCreate(input: $input) {
         cart { ...CartFields }
         userErrors { code field message }
       }
     }`,
    {
      input: {
        lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity }))
      }
    }
  );
  return unwrapCart(data.cartCreate, "cartCreate");
}
async function getCart(cartId) {
  const data = await storefrontFetch(
    `${CART_FRAGMENT}
     query getCart($cartId: ID!) {
       cart(id: $cartId) { ...CartFields }
     }`,
    { cartId }
  );
  return data.cart ? normalizeCart(data.cart) : null;
}
async function addCartLines(cartId, lines) {
  const data = await storefrontFetch(
    `${CART_FRAGMENT}
     mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
       cartLinesAdd(cartId: $cartId, lines: $lines) {
         cart { ...CartFields }
         userErrors { code field message }
       }
     }`,
    {
      cartId,
      lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity }))
    }
  );
  return unwrapCart(data.cartLinesAdd, "cartLinesAdd");
}
async function updateCartLines(cartId, updates) {
  const data = await storefrontFetch(
    `${CART_FRAGMENT}
     mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
       cartLinesUpdate(cartId: $cartId, lines: $lines) {
         cart { ...CartFields }
         userErrors { code field message }
       }
     }`,
    {
      cartId,
      lines: updates.map((u) => ({ id: u.lineId, quantity: u.quantity }))
    }
  );
  return unwrapCart(data.cartLinesUpdate, "cartLinesUpdate");
}
async function removeCartLines(cartId, lineIds) {
  const data = await storefrontFetch(
    `${CART_FRAGMENT}
     mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
       cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
         cart { ...CartFields }
         userErrors { code field message }
       }
     }`,
    { cartId, lineIds }
  );
  return unwrapCart(data.cartLinesRemove, "cartLinesRemove");
}

// server/routers/commerce.ts
var cartLineInputSchema = z2.object({
  variantId: z2.string().min(1),
  quantity: z2.number().int().min(1).max(99)
});
var cartLineUpdateSchema = z2.object({
  lineId: z2.string().min(1),
  quantity: z2.number().int().min(0).max(99)
});
var commerceRouter = router({
  products: router({
    list: publicProcedure.input(
      z2.object({
        first: z2.number().int().min(1).max(100).optional(),
        collectionHandle: z2.string().min(1).optional()
      }).optional()
    ).query(async ({ input }) => {
      return listProducts(input ?? {});
    }),
    byHandle: publicProcedure.input(z2.object({ handle: z2.string().min(1) })).query(async ({ input }) => {
      return getProductByHandle(input.handle);
    })
  }),
  collections: router({
    list: publicProcedure.input(z2.object({ first: z2.number().int().min(1).max(50).optional() }).optional()).query(async ({ input }) => {
      return listCollections(input?.first);
    }),
    byHandle: publicProcedure.input(z2.object({ handle: z2.string().min(1) })).query(async ({ input }) => {
      return getCollectionByHandle(input.handle);
    })
  }),
  cart: router({
    create: publicProcedure.input(z2.object({ lines: z2.array(cartLineInputSchema).min(1).max(50) })).mutation(async ({ input }) => {
      return createCart(input.lines);
    }),
    get: publicProcedure.input(z2.object({ cartId: z2.string().min(1) })).query(async ({ input }) => {
      return getCart(input.cartId);
    }),
    addLines: publicProcedure.input(
      z2.object({
        cartId: z2.string().min(1),
        lines: z2.array(cartLineInputSchema).min(1).max(50)
      })
    ).mutation(async ({ input }) => {
      return addCartLines(input.cartId, input.lines);
    }),
    updateLines: publicProcedure.input(
      z2.object({
        cartId: z2.string().min(1),
        lines: z2.array(cartLineUpdateSchema).min(1).max(50)
      })
    ).mutation(async ({ input }) => {
      const toRemove = input.lines.filter((l) => l.quantity === 0).map((l) => l.lineId);
      const toUpdate = input.lines.filter((l) => l.quantity > 0);
      let cart = null;
      if (toUpdate.length) {
        cart = await updateCartLines(input.cartId, toUpdate);
      }
      if (toRemove.length) {
        cart = await removeCartLines(input.cartId, toRemove);
      }
      if (!cart) cart = await getCart(input.cartId);
      return cart;
    }),
    removeLines: publicProcedure.input(
      z2.object({
        cartId: z2.string().min(1),
        lineIds: z2.array(z2.string().min(1)).min(1).max(50)
      })
    ).mutation(async ({ input }) => {
      return removeCartLines(input.cartId, input.lineIds);
    })
  })
});

// server/routers/decor.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z3 } from "zod";

// server/_core/imageGeneration.ts
var DEFAULT_IMAGE_MODEL = "MODEL_GPT_IMAGE_2";
var DEFAULT_IMAGE_QUALITY = "medium";
async function generateImage(options) {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();
  const model = options.model ?? DEFAULT_IMAGE_MODEL;
  const quality = options.quality ?? (model === DEFAULT_IMAGE_MODEL ? DEFAULT_IMAGE_QUALITY : void 0);
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || [],
      model,
      ...quality ? { quality } : {}
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const result = await response.json();
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url
  };
}

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/routers/decor.ts
var requestSchema = z3.object({ requestId: z3.string().uuid() });
var recommendationSchema = {
  type: "object",
  properties: {
    detectedSubject: { type: "string" },
    spaceSummary: { type: "string" },
    styleDirection: { type: "string" },
    recommendedActions: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          area: { type: "string" },
          title: { type: "string" },
          detail: { type: "string" },
          priority: { type: "string" }
        },
        required: ["area", "title", "detail", "priority"],
        additionalProperties: false
      }
    },
    stickerSuggestion: {
      type: "object",
      properties: { material: { type: "string" }, finish: { type: "string" }, placement: { type: "string" }, reason: { type: "string" } },
      required: ["material", "finish", "placement", "reason"],
      additionalProperties: false
    },
    wallpaperSuggestion: {
      type: "object",
      properties: { material: { type: "string" }, placement: { type: "string" }, reason: { type: "string" } },
      required: ["material", "placement", "reason"],
      additionalProperties: false
    },
    furniturePlacement: { type: "string" },
    frameAndAccentPlan: { type: "string" },
    palette: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
    assumptions: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    safetyNotice: { type: "string" }
  },
  required: ["detectedSubject", "spaceSummary", "styleDirection", "recommendedActions", "stickerSuggestion", "wallpaperSuggestion", "furniturePlacement", "frameAndAccentPlan", "palette", "assumptions", "safetyNotice"],
  additionalProperties: false
};
function parseRecommendation(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
function asGeneratedKey(url) {
  const prefix = "/manus-storage/";
  if (!url?.startsWith(prefix)) throw new Error("Generated preview storage reference was unavailable");
  return decodeURIComponent(url.slice(prefix.length));
}
async function publicPreview(record) {
  const generatedPreviewUrl = record.generatedPreviewKey ? (await storageGet(record.generatedPreviewKey)).url : null;
  return {
    requestId: record.requestId,
    photoType: record.photoType,
    subjectType: record.subjectType,
    stylePreference: record.stylePreference,
    budgetPreference: record.budgetPreference,
    status: record.status,
    recommendation: parseRecommendation(record.recommendationJson),
    generatedPreviewUrl,
    createdAt: record.createdAt
  };
}
async function requirePreview(requestId) {
  const record = await getDecorPreviewByRequestId(requestId);
  if (!record) throw new TRPCError4({ code: "NOT_FOUND", message: "This decor request could not be found." });
  return record;
}
function decoratePrompt(record) {
  return [
    "You are Mila Interior Solutions' visual decor consultant. Analyze the single customer-supplied photo for decor inspiration only.",
    `Photo type: ${record.photoType}. Subject supplied by customer: ${record.subjectType ?? "not specified"}.`,
    `Style preference: ${record.stylePreference ?? "not specified"}. Budget preference: ${record.budgetPreference ?? "not specified"}.`,
    "Write clear Bengali-first, English-supported customer guidance. Recommend elegant sticker/decor, wallpaper, furniture placement, wall frames or accents only when visually appropriate.",
    "Do not identify people, infer private attributes, make structural or electrical claims, estimate exact dimensions, promise material availability, or present this as an architectural plan. If visibility is limited, state an assumption instead of guessing.",
    "Keep every recommendation practical, specific to the visible photo, and concise. The safety notice must explicitly say a human/site measurement is needed before execution."
  ].join("\n");
}
function conceptualPreviewPrompt(record, recommendation) {
  const actions = recommendation.recommendedActions.map((action) => `${action.area}: ${action.title} \u2014 ${action.detail}`).join("; ");
  return [
    "Edit the provided customer photo into one photorealistic, concept-only interior decor preview for Mila Interior Solutions.",
    "Preserve the exact room or furniture geometry, perspective, camera angle, light direction, floor, walls, existing object positions, brand labels, and all people or identities. Do not crop, remove, add, or alter people. Do not invent a different room, a new furniture item, measurements, text, watermark, logo, or signage.",
    `Photo type: ${record.photoType}. Style direction: ${recommendation.styleDirection}.`,
    `Apply only visually plausible elements that follow these suggestions: ${actions}.`,
    `Use this surface treatment direction only where appropriate: ${recommendation.stickerSuggestion.material}, ${recommendation.stickerSuggestion.finish}, ${recommendation.stickerSuggestion.placement}.`,
    `Wallpaper direction only where suitable: ${recommendation.wallpaperSuggestion.material}, ${recommendation.wallpaperSuggestion.placement}.`,
    "The result must look like a respectful visual concept over the same supplied image, not a final installation drawing or a promise of exact available materials."
  ].join("\n");
}
var decorRouter = router({
  get: publicProcedure.input(requestSchema).query(async ({ input }) => publicPreview(await requirePreview(input.requestId))),
  analyze: publicProcedure.input(requestSchema).mutation(async ({ input }) => {
    const record = await requirePreview(input.requestId);
    if (record.status === "ready" || record.status === "complete") return publicPreview(record);
    if (record.status === "analyzing" || record.status === "generating") {
      throw new TRPCError4({ code: "CONFLICT", message: "This decor request is already being prepared." });
    }
    await updateDecorPreview(record.requestId, { status: "analyzing", errorMessage: null });
    try {
      const sourceUrl = await storageGetSignedUrl(record.sourceImageKey);
      const response = await invokeLLM({
        model: "gemini-3-flash-preview",
        maxTokens: 2600,
        messages: [
          { role: "system", content: "Return only JSON matching the provided strict schema." },
          { role: "user", content: [{ type: "text", text: decoratePrompt(record) }, { type: "image_url", image_url: { url: sourceUrl, detail: "high" } }] }
        ],
        response_format: { type: "json_schema", json_schema: { name: "mila_decor_recommendation", strict: true, schema: recommendationSchema } }
      });
      const content = response.choices[0]?.message.content;
      if (typeof content !== "string") throw new Error("Vision analysis returned no structured content");
      const recommendation = JSON.parse(content);
      const updated = await updateDecorPreview(record.requestId, { status: "ready", recommendationJson: JSON.stringify(recommendation), errorMessage: null });
      if (!updated) throw new Error("Decor request was not available after analysis");
      return publicPreview(updated);
    } catch (error) {
      await updateDecorPreview(record.requestId, { status: "failed", errorMessage: "Analysis could not be completed. Please retry." });
      console.error("[Decor analysis] failed", error instanceof Error ? error.message : "unknown error");
      throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "We could not analyze this photo right now. Please retry shortly." });
    }
  }),
  generatePreview: publicProcedure.input(requestSchema).mutation(async ({ input }) => {
    const record = await requirePreview(input.requestId);
    if (record.generatedPreviewKey && record.status === "complete") return publicPreview(record);
    if (record.status === "generating") throw new TRPCError4({ code: "CONFLICT", message: "Your conceptual preview is already being created." });
    const recommendation = parseRecommendation(record.recommendationJson);
    if (!recommendation || record.status !== "ready" && record.status !== "complete") {
      throw new TRPCError4({ code: "BAD_REQUEST", message: "Prepare the decor recommendations before requesting a visual preview." });
    }
    await updateDecorPreview(record.requestId, { status: "generating", errorMessage: null });
    try {
      const sourceUrl = await storageGetSignedUrl(record.sourceImageKey);
      const generated = await generateImage({
        prompt: conceptualPreviewPrompt(record, recommendation),
        originalImages: [{ url: sourceUrl, mimeType: record.sourceImageMimeType }]
      });
      const generatedPreviewKey = asGeneratedKey(generated.url);
      const updated = await updateDecorPreview(record.requestId, { status: "complete", generatedPreviewKey, errorMessage: null });
      if (!updated) throw new Error("Decor request was not available after preview generation");
      return publicPreview(updated);
    } catch (error) {
      await updateDecorPreview(record.requestId, { status: "ready", errorMessage: "Visual preview could not be completed. You can retry." });
      console.error("[Decor preview] failed", error instanceof Error ? error.message : "unknown error");
      throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "The visual preview could not be created right now. Your recommendations are still available." });
    }
  })
});

// server/routers/finance.ts
import { z as z4 } from "zod";
var entryTypeSchema = z4.enum(["revenue", "expense"]);
var categorySchema = z4.enum(["advertising", "salary", "product_cost", "materials", "packaging", "rent", "courier", "service_income", "digital_payment", "other"]);
var paymentMethodSchema = z4.enum(["cash", "bkash", "nagad", "rocket", "bank", "card", "pathao", "other"]);
var recurrenceSchema = z4.enum(["none", "monthly"]);
var financeMonthSchema = z4.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM format");
var financeEntrySchema = z4.object({
  transactionDate: z4.coerce.date(),
  entryType: entryTypeSchema,
  category: categorySchema,
  platform: z4.string().trim().max(120).optional().or(z4.literal("")),
  campaign: z4.string().trim().max(160).optional().or(z4.literal("")),
  counterparty: z4.string().trim().max(160).optional().or(z4.literal("")),
  referenceId: z4.string().trim().max(160).optional().or(z4.literal("")),
  paymentMethod: paymentMethodSchema.default("cash"),
  recurrence: recurrenceSchema.default("none"),
  amount: z4.coerce.number().positive().max(999999999),
  description: z4.string().trim().min(2).max(4e3)
});
var newTransactionId = () => `FIN-${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`;
var newRecurringProfileId = () => `REC-${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`;
var financeRouter = router({
  summary: adminProcedure.input(z4.object({ month: financeMonthSchema, category: categorySchema.optional(), paymentMethod: paymentMethodSchema.optional() })).query(({ input }) => getFinanceSummary(input.month, { category: input.category, paymentMethod: input.paymentMethod })),
  list: adminProcedure.input(z4.object({ month: financeMonthSchema, category: categorySchema.optional(), paymentMethod: paymentMethodSchema.optional() })).query(({ input }) => listFinanceTransactions(input.month, { category: input.category, paymentMethod: input.paymentMethod })),
  create: adminProcedure.input(financeEntrySchema).mutation(async ({ input }) => {
    const sharedFields = {
      transactionDate: input.transactionDate,
      entryType: input.entryType,
      category: input.category,
      platform: input.platform || null,
      campaign: input.campaign || null,
      counterparty: input.counterparty || null,
      referenceId: input.referenceId || null,
      paymentMethod: input.paymentMethod,
      amount: input.amount.toFixed(2),
      description: input.description
    };
    if (input.recurrence === "monthly") {
      const recurringProfileId = newRecurringProfileId();
      return createFinanceTransactionWithRecurringProfile(
        { transactionId: newTransactionId(), ...sharedFields, recurrence: "monthly", recurringProfileId },
        { recurringProfileId, ...sharedFields, startDate: input.transactionDate, status: "active" }
      );
    }
    return createFinanceTransaction({ transactionId: newTransactionId(), ...sharedFields, recurrence: "none", recurringProfileId: null });
  }),
  carryForward: adminProcedure.input(z4.object({ month: financeMonthSchema })).mutation(({ input }) => carryForwardRecurringFinanceEntries(input.month, newTransactionId))
});

// server/routers/orders.ts
import { z as z5 } from "zod";

// shared/stickerPricing.ts
var STICKER_QUALITIES = [
  { id: "regular", label: "Regular Sticker", bangla: "\u09B0\u09C7\u0997\u09C1\u09B2\u09BE\u09B0 \u09B8\u09CD\u099F\u09BF\u0995\u09BE\u09B0", rate: 60, note: "Economical & standard finish" },
  { id: "matte-pr", label: "Matte PR Sticker", bangla: "\u09AE\u09CD\u09AF\u09BE\u099F PR \u09B8\u09CD\u099F\u09BF\u0995\u09BE\u09B0", rate: 80, note: "Anti-glare matte finish" },
  { id: "glossy-pr", label: "Glossy PR Sticker", bangla: "\u0997\u09CD\u09B2\u09B8\u09BF PR \u09B8\u09CD\u099F\u09BF\u0995\u09BE\u09B0", rate: 80, note: "Vibrant gloss & shine" },
  { id: "glittery", label: "Glittery Sticker", bangla: "\u0997\u09CD\u09B2\u09BF\u099F\u09BE\u09B0\u09C0 \u09B8\u09CD\u099F\u09BF\u0995\u09BE\u09B0", rate: 120, note: "Luxury diamond sparkle" },
  { id: "three-d", label: "3D Sticker", bangla: "3D \u09B8\u09CD\u099F\u09BF\u0995\u09BE\u09B0", rate: 90, note: "Depth & dimensional effect" },
  { id: "reflective", label: "Reflective Sticker", bangla: "\u09B0\u09BF\u09AB\u09CD\u09B2\u09C7\u0995\u09CD\u099F\u09BF\u09AD \u09B8\u09CD\u099F\u09BF\u0995\u09BE\u09B0", rate: 90, note: "High-visibility glow" }
];
var DELIVERY_OPTIONS = [
  { id: "courier_dhaka", label: "Courier delivery \u2014 Inside Dhaka", bangla: "\u0995\u09C1\u09B0\u09BF\u09DF\u09BE\u09B0 \u09A1\u09C7\u09B2\u09BF\u09AD\u09BE\u09B0\u09BF \u2014 \u09A2\u09BE\u0995\u09BE\u09B0 \u09AD\u09BF\u09A4\u09B0\u09C7", charge: 70, mode: "courier" },
  { id: "courier_outside_dhaka", label: "Courier delivery \u2014 Outside Dhaka", bangla: "\u0995\u09C1\u09B0\u09BF\u09DF\u09BE\u09B0 \u09A1\u09C7\u09B2\u09BF\u09AD\u09BE\u09B0\u09BF \u2014 \u09A2\u09BE\u0995\u09BE\u09B0 \u09AC\u09BE\u0987\u09B0\u09C7", charge: 150, mode: "courier" },
  { id: "showroom_pickup", label: "Office / showroom pickup", bangla: "\u0985\u09AB\u09BF\u09B8 / \u09B6\u09CB\u09B0\u09C1\u09AE \u09AA\u09BF\u0995\u0986\u09AA", charge: 0, mode: "pickup" },
  { id: "dhaka_home_service", label: "Dhaka home service", bangla: "\u09A2\u09BE\u0995\u09BE \u09B9\u09CB\u09AE \u09B8\u09BE\u09B0\u09CD\u09AD\u09BF\u09B8", charge: 500, mode: "home" }
];
var positiveNumber = (value) => Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0;
var rounded = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
function getStickerQuality(id) {
  return STICKER_QUALITIES.find((quality) => quality.id === id) ?? STICKER_QUALITIES[0];
}
function getDeliveryOption(id) {
  return DELIVERY_OPTIONS.find((option) => option.id === id) ?? DELIVERY_OPTIONS[0];
}
function calculateRowSquareFeet(row) {
  const quantity = positiveNumber(row.quantity) || 1;
  const customSquareFeet = positiveNumber(row.customSquareFeet);
  if (customSquareFeet) return rounded(customSquareFeet * quantity);
  return rounded(positiveNumber(row.length) * positiveNumber(row.width) * quantity / 144);
}
function calculateStickerLine(row, fallbackQualityId = "regular", index = 0) {
  const quality = getStickerQuality(row.qualityId ?? fallbackQualityId);
  const squareFeet = calculateRowSquareFeet(row);
  return {
    label: row.label?.trim() || `Part ${String(index + 1).padStart(2, "0")}`,
    quality,
    quantity: positiveNumber(row.quantity) || 1,
    squareFeet,
    unitPrice: quality.rate,
    lineTotal: rounded(squareFeet * quality.rate)
  };
}
function calculateStickerOrder(input) {
  const delivery = getDeliveryOption(input.deliveryOptionId);
  const lineItems = input.measurements.map((row, index) => calculateStickerLine(row, input.qualityId ?? "regular", index));
  const totalSquareFeet = rounded(lineItems.reduce((total, line) => total + line.squareFeet, 0));
  const productValue = rounded(lineItems.reduce((total, line) => total + line.lineTotal, 0));
  const firstLine = lineItems[0] ?? calculateStickerLine({}, input.qualityId ?? "regular");
  return { quality: firstLine.quality, delivery, lineItems, totalSquareFeet, unitPrice: firstLine.unitPrice, productValue, deliveryCharge: delivery.charge, totalPayable: rounded(productValue + delivery.charge) };
}

// server/routers/orders.ts
var orderStatusSchema = z5.enum(["new", "confirmed", "processing", "delivered", "cancelled"]);
var paymentStatusSchema = z5.enum(["unpaid", "partial", "paid"]);
var paymentMethodSchema2 = z5.enum(["cod", "mobile_banking", "bank_transfer", "online_card", "other"]);
var paymentProviderSchema = z5.enum(["cod", "bkash", "nagad", "rocket", "bank_transfer", "card"]);
var sourceSchema = z5.enum(["website", "phone", "whatsapp", "walk_in"]);
var deliveryModeSchema = z5.enum(["home", "courier", "pickup"]);
var stickerQualitySchema = z5.enum(["regular", "matte-pr", "glossy-pr", "glittery", "three-d", "reflective"]);
var deliveryOptionSchema = z5.enum(["courier_dhaka", "courier_outside_dhaka", "showroom_pickup", "dhaka_home_service"]);
var MAX_CUSTOM_MEASUREMENTS = 50;
var approvedDesignImageSchema = z5.string().trim().regex(/^\/manus-storage\/[\w.-]+$/, "Use a Mila catalogue image reference");
var selectedDesignSchema = z5.object({
  id: z5.string().trim().min(2).max(160),
  kind: z5.enum(["sticker", "wallpaper"]),
  category: z5.string().trim().min(2).max(120),
  english: z5.string().trim().min(2).max(160),
  bangla: z5.string().trim().max(160).optional().or(z5.literal("")),
  image: approvedDesignImageSchema.optional()
});
var createManualOrderSchema = z5.object({
  businessOrderId: z5.string().trim().max(64).optional().or(z5.literal("")),
  customerName: z5.string().trim().min(2).max(160),
  customerPhone: z5.string().trim().min(6).max(40),
  customerEmail: z5.string().trim().email().max(320).optional().or(z5.literal("")),
  deliveryAddress: z5.string().trim().max(3e3).optional().or(z5.literal("")),
  district: z5.string().trim().max(120).optional().or(z5.literal("")),
  policeStation: z5.string().trim().max(120).optional().or(z5.literal("")),
  locality: z5.string().trim().max(160).optional().or(z5.literal("")),
  productCode: z5.string().trim().max(80).optional().or(z5.literal("")),
  productSummary: z5.string().trim().min(2).max(5e3),
  serviceSpecifications: z5.string().trim().max(8e3).optional().or(z5.literal("")),
  dimensions: z5.string().trim().max(200).optional().or(z5.literal("")),
  assignedTo: z5.string().trim().max(160).optional().or(z5.literal("")),
  internalNotes: z5.string().trim().max(4e3).optional().or(z5.literal("")),
  quantity: z5.coerce.number().int().min(1).max(999).default(1),
  unitLabel: z5.string().trim().min(1).max(30).default("pcs"),
  source: sourceSchema.default("phone"),
  deliveryMode: deliveryModeSchema.default("courier"),
  preferredServiceTime: z5.string().trim().max(500).optional().or(z5.literal("")),
  orderValue: z5.coerce.number().min(0).max(999999999),
  deliveryCharge: z5.coerce.number().min(0).max(999999999).default(0),
  prepaymentAmount: z5.coerce.number().min(0).max(999999999).default(0),
  paymentMethod: paymentMethodSchema2.default("cod"),
  paymentStatus: paymentStatusSchema.default("unpaid")
}).refine((data) => data.prepaymentAmount <= data.orderValue + data.deliveryCharge, { path: ["prepaymentAmount"], message: "Prepayment cannot exceed the total payable amount" }).refine((data) => data.orderValue + data.deliveryCharge > 0, { path: ["orderValue"], message: "Enter the product price and delivery charge before placing the order" });
var measurementSchema = z5.object({
  label: z5.string().trim().max(100).optional().or(z5.literal("")),
  qualityId: stickerQualitySchema.default("regular"),
  length: z5.coerce.number().min(0).max(1e3).optional(),
  width: z5.coerce.number().min(0).max(1e3).optional(),
  quantity: z5.coerce.number().int().min(1).max(200).default(1),
  customSquareFeet: z5.coerce.number().min(0).max(1e5).optional()
}).superRefine((value, ctx) => {
  const hasCustom = Boolean(value.customSquareFeet && value.customSquareFeet > 0);
  const hasDimensions = Boolean(value.length && value.length > 0 && value.width && value.width > 0);
  if (!hasCustom && !hasDimensions) ctx.addIssue({ code: "custom", message: "Enter length and width, or custom square feet" });
});
var stickerCheckoutSchema = z5.object({
  productCategory: z5.string().trim().min(2).max(120),
  productCode: z5.string().trim().max(80).optional().or(z5.literal("")),
  selectedDesigns: z5.array(selectedDesignSchema).max(12).default([]),
  measurements: z5.array(measurementSchema).min(1).max(MAX_CUSTOM_MEASUREMENTS),
  deliveryOption: deliveryOptionSchema,
  customerName: z5.string().trim().min(2).max(160),
  customerPhone: z5.string().trim().min(6).max(40),
  customerEmail: z5.string().trim().email().max(320).optional().or(z5.literal("")),
  deliveryAddress: z5.string().trim().min(8).max(3e3),
  district: z5.string().trim().min(2).max(120),
  policeStation: z5.string().trim().min(2).max(120),
  locality: z5.string().trim().min(2).max(160),
  specialInstructions: z5.string().trim().max(1e3).optional().or(z5.literal("")),
  paymentProvider: paymentProviderSchema,
  prepaymentAmount: z5.coerce.number().min(0).max(999999999).default(0),
  paymentReference: z5.string().trim().max(160).optional().or(z5.literal("")),
  paymentProofKey: z5.string().trim().max(512).optional().or(z5.literal(""))
}).superRefine((value, ctx) => {
  const calculation = calculateStickerOrder({ deliveryOptionId: value.deliveryOption, measurements: value.measurements });
  if (calculation.totalSquareFeet <= 0) ctx.addIssue({ code: "custom", path: ["measurements"], message: "Your total sticker area must be greater than zero" });
  if (value.prepaymentAmount > calculation.totalPayable) ctx.addIssue({ code: "custom", path: ["prepaymentAmount"], message: "Prepayment cannot exceed the total payable amount" });
});
var orderFiltersSchema = z5.object({ search: z5.string().trim().max(160).optional(), status: orderStatusSchema.optional(), paymentStatus: paymentStatusSchema.optional(), source: sourceSchema.optional(), deliveryMode: deliveryModeSchema.optional() }).optional();
var lookupOrderSchema = z5.object({ orderNumber: z5.string().trim().regex(/^(MLA-\d{8,14}|\d{4,64})$/, "Use the order number shown in your confirmation"), customerPhone: z5.string().trim().min(6).max(40) });
var newOrderNumber = () => `MLA-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;
var providerToPaymentMethod = (provider) => provider === "cod" ? "cod" : provider === "card" ? "online_card" : provider === "bank_transfer" ? "bank_transfer" : "mobile_banking";
var ordersRouter = router({
  summary: staffProcedure.query(() => getManualOrderSummary()),
  list: staffProcedure.input(orderFiltersSchema).query(({ input }) => listManualOrders(input)),
  exportCsv: staffProcedure.input(orderFiltersSchema).query(async ({ input }) => {
    const orders = await listManualOrders(input);
    return { fileName: `mila-orders-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`, csv: createOrderCsv(orders), rowCount: orders.length };
  }),
  create: staffProcedure.input(createManualOrderSchema).mutation(async ({ input }) => createManualOrder({ orderNumber: newOrderNumber(), businessOrderId: input.businessOrderId || null, customerName: input.customerName, customerPhone: normalizePhoneNumber(input.customerPhone), customerEmail: input.customerEmail || null, deliveryAddress: input.deliveryAddress || null, district: input.district || null, policeStation: input.policeStation || null, locality: input.locality || null, productCode: input.productCode || null, productSummary: input.productSummary, serviceSpecifications: input.serviceSpecifications || null, dimensions: input.dimensions || null, assignedTo: input.assignedTo || null, internalNotes: input.internalNotes || null, quantity: input.quantity, unitLabel: input.unitLabel, source: input.source, deliveryMode: input.deliveryMode, preferredServiceTime: input.preferredServiceTime || null, status: "new", paymentMethod: input.paymentMethod, paymentStatus: input.paymentStatus, orderValue: input.orderValue.toFixed(2), deliveryCharge: input.deliveryCharge.toFixed(2), prepaymentAmount: input.prepaymentAmount.toFixed(2) })),
  placeStickerOrder: publicProcedure.input(stickerCheckoutSchema).mutation(async ({ input }) => {
    const calculation = calculateStickerOrder({ deliveryOptionId: input.deliveryOption, measurements: input.measurements });
    const paymentStatus = input.prepaymentAmount >= calculation.totalPayable ? "paid" : input.prepaymentAmount > 0 ? "partial" : "unpaid";
    const firstDimension = input.measurements.find((row) => row.length && row.width);
    const requirements = [
      input.selectedDesigns.length ? `Selected designs: ${input.selectedDesigns.map((design) => `${design.english} (${design.id})`).join(", ")}` : "",
      ...calculation.lineItems.map((line, index) => `${index + 1}. ${line.label} \xB7 ${line.quality.label} \xB7 ${line.squareFeet} sqft \xD7 \u09F3${line.unitPrice} = \u09F3${line.lineTotal}`),
      input.specialInstructions ? `Instructions: ${input.specialInstructions}` : ""
    ].filter(Boolean).join("\n");
    const uniqueQualityIds = Array.from(new Set(calculation.lineItems.map((line) => line.quality.id)));
    const order = await createManualOrder({ orderNumber: newOrderNumber(), businessOrderId: null, customerName: input.customerName, customerPhone: normalizePhoneNumber(input.customerPhone), customerEmail: input.customerEmail || null, deliveryAddress: input.deliveryAddress, district: input.district, policeStation: input.policeStation, locality: input.locality, productCode: input.productCode || null, productSummary: input.productCategory, selectedDesigns: JSON.stringify(input.selectedDesigns), designSourceUrl: "https://drive.google.com/drive/folders/1dbOi0ArZKFbRGtIEo4kRqV2ZXlqM-F_f?usp=sharing", serviceSpecifications: requirements, stickerType: uniqueQualityIds.length === 1 ? uniqueQualityIds[0] : "mixed-quality", stickerMeasurements: JSON.stringify(input.measurements), calculatedSquareFeet: calculation.totalSquareFeet.toFixed(2), unitPrice: uniqueQualityIds.length === 1 ? calculation.unitPrice.toFixed(2) : null, customSquareFeet: input.measurements.reduce((total, row) => total + (Number(row.customSquareFeet) || 0) * (Number(row.quantity) || 1), 0).toFixed(2), dimensions: firstDimension ? `${firstDimension.length} \xD7 ${firstDimension.width} inch` : null, quantity: input.measurements.reduce((total, row) => total + row.quantity, 0), unitLabel: "sqft", source: "website", deliveryMode: calculation.delivery.mode, deliveryOption: input.deliveryOption, preferredServiceTime: null, status: "new", paymentMethod: providerToPaymentMethod(input.paymentProvider), paymentProvider: input.paymentProvider, paymentReference: input.paymentReference || null, paymentProofKey: input.paymentProofKey || null, paymentStatus, orderValue: calculation.productValue.toFixed(2), deliveryCharge: calculation.deliveryCharge.toFixed(2), prepaymentAmount: input.prepaymentAmount.toFixed(2) });
    return { orderNumber: order.orderNumber, selectedDesigns: input.selectedDesigns, lineItems: calculation.lineItems, totalSquareFeet: calculation.totalSquareFeet, productValue: calculation.productValue, deliveryCharge: calculation.deliveryCharge, totalPayable: calculation.totalPayable, duePayment: Math.max(calculation.totalPayable - input.prepaymentAmount, 0) };
  }),
  quoteStickerOrder: publicProcedure.input(z5.object({ deliveryOption: deliveryOptionSchema, measurements: z5.array(measurementSchema).max(MAX_CUSTOM_MEASUREMENTS) })).query(({ input }) => calculateStickerOrder({ deliveryOptionId: input.deliveryOption, measurements: input.measurements })),
  updateStatus: staffProcedure.input(z5.object({ orderNumber: z5.string().min(1).max(32), status: orderStatusSchema.optional(), paymentMethod: paymentMethodSchema2.optional(), paymentStatus: paymentStatusSchema.optional(), prepaymentAmount: z5.coerce.number().min(0).max(999999999).optional(), deliveryCharge: z5.coerce.number().min(0).max(999999999).optional(), deliveryMode: deliveryModeSchema.optional(), preferredServiceTime: z5.string().trim().max(500).optional(), assignedTo: z5.string().trim().max(160).optional(), internalNotes: z5.string().trim().max(4e3).optional(), complaintNote: z5.string().trim().max(4e3).optional(), followUpAt: z5.coerce.date().nullable().optional() })).mutation(async ({ input }) => {
    const { orderNumber, prepaymentAmount, deliveryCharge, ...updates } = input;
    return updateManualOrderStatus(orderNumber, { ...updates, prepaymentAmount: prepaymentAmount === void 0 ? void 0 : prepaymentAmount.toFixed(2), deliveryCharge: deliveryCharge === void 0 ? void 0 : deliveryCharge.toFixed(2) });
  }),
  lookup: publicProcedure.input(lookupOrderSchema).query(async ({ input }) => {
    const order = await findManualOrderForCustomer(input.orderNumber, normalizePhoneNumber(input.customerPhone));
    if (!order) return null;
    return { orderNumber: order.orderNumber, productSummary: order.productSummary, quantity: order.quantity, unitLabel: order.unitLabel, serviceSpecifications: order.serviceSpecifications, status: order.status, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, deliveryMode: order.deliveryMode, preferredServiceTime: order.preferredServiceTime, createdAt: order.createdAt };
  })
});

// server/routers/site.ts
import { z as z6 } from "zod";
var websiteSettingSchema = z6.object({
  settingKey: z6.string().trim().regex(/^[a-z][a-z0-9_.-]{1,79}$/i, "Use a short letters/numbers setting key"),
  settingValue: z6.string().trim().min(1).max(4e3),
  isPublic: z6.boolean().default(true)
});
var siteRouter = router({
  publicSettings: publicProcedure.query(() => listPublicWebsiteSettings()),
  list: superAdminProcedure.query(() => listWebsiteSettings()),
  save: superAdminProcedure.input(websiteSettingSchema).mutation(({ ctx, input }) => upsertWebsiteSetting({ settingKey: input.settingKey, settingValue: input.settingValue, isPublic: input.isPublic ? 1 : 0, updatedBy: ctx.user.openId }))
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  commerce: commerceRouter,
  decor: decorRouter,
  finance: financeRouter,
  orders: ordersRouter,
  site: siteRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
function createApp() {
  const app = express();
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ limit: "12mb", extended: true }));
  registerStorageProxy(app);
  registerPaymentProofRoutes(app);
  registerDecorPhotoRoutes(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}

// server/_core/vercelEntry.ts
var vercelEntry_default = createApp();
export {
  vercelEntry_default as default
};
