import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray, like } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { financeRecurringProfiles, financeTransactions } from "../drizzle/schema";

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const testDescription = `Router integration test rent ${suffix}`;

function makeCtx(): TrpcContext {
  return {
    user: {
      id: 999999,
      openId: "finance-test-admin",
      name: "Finance Test Admin",
      email: "finance-test@example.com",
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

async function cleanup() {
  const db = await getDb();
  if (!db) return;
  const profiles = await db.select().from(financeRecurringProfiles).where(like(financeRecurringProfiles.description, "Router integration test rent %"));
  const profileIds = profiles.map(profile => profile.recurringProfileId);
  if (profileIds.length) await db.delete(financeTransactions).where(inArray(financeTransactions.recurringProfileId, profileIds));
  if (profileIds.length) await db.delete(financeRecurringProfiles).where(inArray(financeRecurringProfiles.recurringProfileId, profileIds));
}

describe("finance router recurring carry-forward", () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it("creates a recurring profile, carries it into the next month, exposes it in list/summary, and is idempotent", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const created = await caller.finance.create({
      transactionDate: "2037-08-05",
      entryType: "expense",
      category: "rent",
      paymentMethod: "bank",
      recurrence: "monthly",
      amount: 18000,
      description: testDescription,
    });

    // The router generates IDs, so locate the created profile by its unique test description.
    const db = await getDb();
    if (!db) throw new Error("Database unavailable for integration test");
    const profiles = await db.select().from(financeRecurringProfiles).where(eq(financeRecurringProfiles.description, testDescription));
    const profile = profiles.at(-1);
    expect(created).toMatchObject({ recurrence: "monthly", description: testDescription });
    expect(profile?.status).toBe("active");

    const first = await caller.finance.carryForward({ month: "2037-09" });
    expect(first.created).toBe(1);
    const listed = await caller.finance.list({ month: "2037-09", category: "rent", paymentMethod: "bank" });
    expect(listed).toEqual(expect.arrayContaining([expect.objectContaining({ category: "rent", recurrence: "monthly", amount: "18000.00", description: testDescription })]));
    const summary = await caller.finance.summary({ month: "2037-09", category: "rent", paymentMethod: "bank" });
    expect(summary.month).toBe("2037-09");
    expect(summary.totalExpense).toBeGreaterThanOrEqual(18000);
    expect(summary.categories).toEqual(expect.arrayContaining([expect.objectContaining({ category: "rent", expense: expect.any(Number) })]));

    const second = await caller.finance.carryForward({ month: "2037-09" });
    expect(second.created).toBe(0);
  });
});
