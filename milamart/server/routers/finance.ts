import { z } from "zod";
import { carryForwardRecurringFinanceEntries, createFinanceTransaction, createFinanceTransactionWithRecurringProfile, getFinanceSummary, listFinanceTransactions } from "../db";
import { adminProcedure, router } from "../_core/trpc";

const entryTypeSchema = z.enum(["revenue", "expense"]);
const categorySchema = z.enum(["advertising", "salary", "product_cost", "materials", "packaging", "rent", "courier", "service_income", "digital_payment", "other"]);
const paymentMethodSchema = z.enum(["cash", "bkash", "nagad", "rocket", "bank", "card", "pathao", "other"]);
const recurrenceSchema = z.enum(["none", "monthly"]);
export const financeMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM format");

export const financeEntrySchema = z.object({
  transactionDate: z.coerce.date(),
  entryType: entryTypeSchema,
  category: categorySchema,
  platform: z.string().trim().max(120).optional().or(z.literal("")),
  campaign: z.string().trim().max(160).optional().or(z.literal("")),
  counterparty: z.string().trim().max(160).optional().or(z.literal("")),
  referenceId: z.string().trim().max(160).optional().or(z.literal("")),
  paymentMethod: paymentMethodSchema.default("cash"),
  recurrence: recurrenceSchema.default("none"),
  amount: z.coerce.number().positive().max(999999999),
  description: z.string().trim().min(2).max(4000),
});

const newTransactionId = () => `FIN-${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`;
const newRecurringProfileId = () => `REC-${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`;

export const financeRouter = router({
  summary: adminProcedure.input(z.object({ month: financeMonthSchema, category: categorySchema.optional(), paymentMethod: paymentMethodSchema.optional() })).query(({ input }) => getFinanceSummary(input.month, { category: input.category, paymentMethod: input.paymentMethod })),
  list: adminProcedure.input(z.object({ month: financeMonthSchema, category: categorySchema.optional(), paymentMethod: paymentMethodSchema.optional() })).query(({ input }) => listFinanceTransactions(input.month, { category: input.category, paymentMethod: input.paymentMethod })),
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
      description: input.description,
    };
    if (input.recurrence === "monthly") {
      const recurringProfileId = newRecurringProfileId();
      return createFinanceTransactionWithRecurringProfile(
        { transactionId: newTransactionId(), ...sharedFields, recurrence: "monthly", recurringProfileId },
        { recurringProfileId, ...sharedFields, startDate: input.transactionDate, status: "active" },
      );
    }
    return createFinanceTransaction({ transactionId: newTransactionId(), ...sharedFields, recurrence: "none", recurringProfileId: null });
  }),
  carryForward: adminProcedure.input(z.object({ month: financeMonthSchema })).mutation(({ input }) => carryForwardRecurringFinanceEntries(input.month, newTransactionId)),
});
