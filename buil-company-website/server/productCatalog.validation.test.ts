import { describe, expect, it } from "vitest";
import { validateProductCatalogIntake } from "@shared/productCatalog";

const gallerySources = Array.from({ length: 10 }, (_, index) => `/manus-storage/product-${index + 1}.jpg`);

const validProduct = {
  handle: "walnut-panel-sticker",
  titleEn: "Walnut Panel Sticker",
  titleBn: "ওয়ালনাট প্যানেল স্টিকার",
  category: "stickers",
  descriptionEn: "A warm walnut surface finish for selected furniture surfaces.",
  descriptionBn: "নির্বাচিত furniture surface-এর জন্য উষ্ণ walnut finish।",
  priceBdt: 2450,
  stock: 8,
  inventoryStatus: "in_stock",
  variants: [{ name: "Finish", value: "Matte" }],
  gallerySources,
  approvedForPublish: true,
};

describe("product catalogue intake validation", () => {
  it("accepts a complete bilingual product with ten approved gallery sources", () => {
    const result = validateProductCatalogIntake(validProduct);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.gallerySources).toHaveLength(10);
  });

  it("rejects a product that is not approved or has an invalid price/stock", () => {
    const result = validateProductCatalogIntake({ ...validProduct, approvedForPublish: false, priceBdt: 0, stock: -1 });
    expect(result.success).toBe(false);
  });

  it("requires ten to twelve gallery sources and controlled image references", () => {
    expect(validateProductCatalogIntake({ ...validProduct, gallerySources: gallerySources.slice(0, 9) }).success).toBe(false);
    expect(validateProductCatalogIntake({ ...validProduct, gallerySources: [...gallerySources.slice(0, 9), "https://example.com/unapproved.jpg"] }).success).toBe(false);
    expect(validateProductCatalogIntake({ ...validProduct, gallerySources: [...gallerySources, "/manus-storage/product-11.jpg", "/manus-storage/product-12.jpg"] }).success).toBe(true);
  });
});
