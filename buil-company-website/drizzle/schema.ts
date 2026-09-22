import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Offline, phone, WhatsApp, and courier orders entered by authorised Mila staff. */
export const manualOrders = mysqlTable("manualOrders", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManualOrder = typeof manualOrders.$inferSelect;
export type InsertManualOrder = typeof manualOrders.$inferInsert;

/** Private, user-submitted photo references and AI-generated conceptual decor reports. */
export const decorPreviews = mysqlTable("decorPreviews", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DecorPreview = typeof decorPreviews.$inferSelect;
export type InsertDecorPreview = typeof decorPreviews.$inferInsert;

/** Append-only operating ledger for revenue, expense, payment reference, and monthly management reporting. */
export const financeTransactions = mysqlTable("financeTransactions", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type InsertFinanceTransaction = typeof financeTransactions.$inferInsert;

/** Reusable monthly ledger template. Staff must explicitly carry a template into each reporting month. */
export const financeRecurringProfiles = mysqlTable("financeRecurringProfiles", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const websiteSettings = mysqlTable("websiteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 80 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  isPublic: tinyint("isPublic").notNull().default(1),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
  updatedBy: varchar("updatedBy", { length: 128 }),
});

export type WebsiteSetting = typeof websiteSettings.$inferSelect;
export type InsertWebsiteSetting = typeof websiteSettings.$inferInsert;

export type FinanceRecurringProfile = typeof financeRecurringProfiles.$inferSelect;
export type InsertFinanceRecurringProfile = typeof financeRecurringProfiles.$inferInsert;
