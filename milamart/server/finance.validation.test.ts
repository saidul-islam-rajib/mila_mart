import { describe, expect, it } from "vitest";
import { getPendingRecurringProfiles, summarizeFinanceEntries } from "./db";
import { financeEntrySchema, financeMonthSchema } from "./routers/finance";

describe("finance ledger validation", () => {
  it("accepts a documented advertising expense with campaign and reference", () => {
    const parsed = financeEntrySchema.parse({
      transactionDate: "2026-08-28",
      entryType: "expense",
      category: "advertising",
      platform: "Meta Ads",
      campaign: "Kitchen makeover August",
      counterparty: "Meta",
      referenceId: "TXN-123",
      paymentMethod: "card",
      recurrence: "none",
      amount: 2500,
      description: "August campaign spend",
    });
    expect(parsed).toMatchObject({ entryType: "expense", category: "advertising", amount: 2500, paymentMethod: "card" });
  });

  it("rejects zero-value entries and invalid reporting periods", () => {
    expect(financeEntrySchema.safeParse({ transactionDate: "2026-08-28", entryType: "revenue", category: "service_income", amount: 0, description: "Service" }).success).toBe(false);
    expect(financeMonthSchema.safeParse("2026-13").success).toBe(false);
    expect(financeMonthSchema.safeParse("2026-08").success).toBe(true);
  });

  it("accepts a monthly recurring expense template setting", () => {
    const parsed = financeEntrySchema.parse({
      transactionDate: "2026-08-28",
      entryType: "expense",
      category: "rent",
      paymentMethod: "bank",
      recurrence: "monthly",
      amount: 18000,
      description: "Showroom rent",
    });
    expect(parsed.recurrence).toBe("monthly");
  });

  it("calculates revenue, expense, net result and category totals from recorded entries", () => {
    const summary = summarizeFinanceEntries([
      { entryType: "revenue", category: "service_income", amount: "12000" },
      { entryType: "revenue", category: "digital_payment", amount: 3500 },
      { entryType: "expense", category: "advertising", amount: "2500.50" },
      { entryType: "expense", category: "materials", amount: 1000 },
    ], "2026-08");
    expect(summary).toMatchObject({ month: "2026-08", entryCount: 4, totalRevenue: 15500, totalExpense: 3500.5, netProfitLoss: 11999.5 });
    expect(summary.categories).toEqual(expect.arrayContaining([
      { category: "service_income", revenue: 12000, expense: 0, count: 1 },
      { category: "advertising", revenue: 0, expense: 2500.5, count: 1 },
    ]));
  });

  it("carries only the active profiles that are missing in the selected month", () => {
    const profiles = [{ recurringProfileId: "REC-RENT" }, { recurringProfileId: "REC-SALARY" }];
    expect(getPendingRecurringProfiles(profiles, ["REC-RENT", null])).toEqual([{ recurringProfileId: "REC-SALARY" }]);
  });
});
