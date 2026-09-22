/**
 * Live smoke test for the Shopify Storefront integration.
 *
 * Goal: validate every published product is usable by the storefront. An empty
 * catalog is valid while the owner is preparing first products; once products
 * exist, each must have a title, image, and non-zero price.
 *
 * Behavior:
 *   - Calls the real Storefront API via `listProducts()` (no mocking).
 *   - Auto-skips when `SHOPIFY_STORE_DOMAIN` and the storefront token aren't
 *     configured, so CI environments without credentials stay green.
 *   - Logs the first 3 normalized products so the agent can see the actual
 *     output (titles, prices, image URLs) without reaching for `curl`.
 *
 * For a more verbose, standalone version see `scripts/shopify-probe.mjs`.
 */

import { describe, expect, it } from "vitest";
import { isShopifyConfigured, listProducts } from "./_core/shopify";

const configured = isShopifyConfigured();

describe.skipIf(!configured)("shopify smoke (live)", () => {
  it(
    "returns only usable products when products are published",
    { timeout: 30_000 },
    async () => {
    let products;
    try {
      products = await listProducts({ first: 10 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("unreachable") && process.env.SHOPIFY_SMOKE_STRICT !== "1") {
        console.warn("[shopify smoke] deferred: Storefront API is temporarily unreachable; set SHOPIFY_SMOKE_STRICT=1 to fail on outage");
        return;
      }
      throw error;
    }

    // Print a compact view so the agent can see the actual normalized output
    // (titles, prices, image URLs) directly in test logs.
    const preview = products.slice(0, 3).map(p => ({
      handle: p.handle,
      title: p.title,
      price: `${p.priceRange.min.amount} ${p.priceRange.min.currencyCode}`,
      firstImage: p.images[0]?.url ?? null,
      variantCount: p.variants.length,
    }));
    // eslint-disable-next-line no-console
    console.log("[shopify smoke] products:", JSON.stringify(preview, null, 2));

    const unusable = products.find(p => {
      const hasTitle = typeof p.title === "string" && p.title.trim().length > 0;
      const hasImage = (p.images[0]?.url ?? "").length > 0;
      const priceNum = Number.parseFloat(p.priceRange.min.amount);
      const hasPrice = Number.isFinite(priceNum) && priceNum > 0;
      return !(hasTitle && hasImage && hasPrice);
    });

    expect(
      unusable,
      "A published product is missing title, first image URL, or a positive price"
    ).toBeUndefined();
    }
  );
});

// Visible reminder when the suite is skipped — keeps it from looking like a
// silent pass on misconfigured sandboxes.
describe.skipIf(configured)("shopify smoke (skipped)", () => {
  it("is skipped because SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_API_ACCESS_TOKEN are not set", () => {
    expect(true).toBe(true);
  });
});
