import { describe, expect, it } from "vitest";
import { normalizePhoneNumber } from "./db";
import { createManualOrderSchema, lookupOrderSchema, stickerCheckoutSchema } from "./routers/orders";

describe("Create New Order validation", () => {
  const validOrder = {
    customerName: "Mila Customer",
    customerPhone: "01700000000",
    productSummary: "Refrigerator sticker, floral finish",
    quantity: 1,
    unitLabel: "set",
    source: "whatsapp" as const,
    deliveryMode: "courier" as const,
    orderValue: 1270,
    deliveryCharge: 80,
    prepaymentAmount: 300,
    paymentStatus: "partial" as const,
  };

  it("accepts a valid order and applies defaults", () => {
    const parsed = createManualOrderSchema.parse(validOrder);
    expect(parsed.source).toBe("whatsapp");
    expect(parsed.deliveryMode).toBe("courier");
    expect(parsed.quantity).toBe(1);
  });

  it("rejects an advance payment higher than the order value", () => {
    expect(() => createManualOrderSchema.parse({ ...validOrder, prepaymentAmount: 1400 })).toThrow("Prepayment cannot exceed the total payable amount");
  });

  it("rejects a service order when no payable amount has been confirmed", () => {
    expect(() => createManualOrderSchema.parse({ ...validOrder, orderValue: 0, deliveryCharge: 0, prepaymentAmount: 0 })).toThrow("Enter the product price and delivery charge");
  });

  it("requires a standard order number and phone number for public lookup", () => {
    expect(lookupOrderSchema.parse({ orderNumber: "MLA-12345678123", customerPhone: "01700000000" })).toMatchObject({ orderNumber: "MLA-12345678123" });
    expect(lookupOrderSchema.parse({ orderNumber: "131656", customerPhone: "01700000000" })).toMatchObject({ orderNumber: "131656" });
    expect(() => lookupOrderSchema.parse({ orderNumber: "MLA-1234", customerPhone: "01700000000" })).toThrow("Use the order number");
  });

  it("normalizes Bangla and formatted phone numbers before saving or lookup", () => {
    expect(normalizePhoneNumber("০১৯১২০৯৩৭৮৩")).toBe("01912093783");
    expect(normalizePhoneNumber("+880 1912-093783")).toBe("8801912093783");
  });

  it("calculates a custom sticker order only from a valid measured surface", () => {
    const baseStickerOrder = {
      productCategory: "refrigerator",
      deliveryOption: "courier_dhaka" as const,
      measurements: [{ length: 60, width: 24, quantity: 1, qualityId: "three-d" as const }],
      customerName: "Mila Customer",
      customerPhone: "01700000000",
      deliveryAddress: "House 1, Road 2, Dhaka 1207",
      district: "Dhaka",
      policeStation: "Mohammadpur",
      locality: "Bosila",
      paymentProvider: "cod" as const,
    };
    expect(stickerCheckoutSchema.parse(baseStickerOrder).measurements).toHaveLength(1);
    expect(() => stickerCheckoutSchema.parse({ ...baseStickerOrder, measurements: [{ quantity: 1 }] })).toThrow("Enter length and width");
  });

  it("keeps approved selected design details with a flexible multi-side order", () => {
    const measurements = Array.from({ length: 12 }, (_, index) => ({ label: `Side ${index + 1}`, length: 24, width: 18, quantity: 1, qualityId: "regular" as const }));
    const parsed = stickerCheckoutSchema.parse({
      productCategory: "refrigerator", deliveryOption: "courier_dhaka", measurements,
      selectedDesigns: [{ id: "fridge-lily", kind: "sticker" as const, category: "refrigerator", english: "Lily Floral", bangla: "লিলি ফ্লোরাল", image: "/manus-storage/sticker-fridge-lily_eb64e565.webp" }],
      customerName: "Mila Customer", customerPhone: "01700000000", deliveryAddress: "House 1, Road 2, Dhaka 1207", district: "Dhaka", policeStation: "Mohammadpur", locality: "Bosila", paymentProvider: "cod" as const,
    });
    expect(parsed.measurements).toHaveLength(12);
    expect(parsed.selectedDesigns[0]?.english).toBe("Lily Floral");
    expect(() => stickerCheckoutSchema.parse({ ...parsed, selectedDesigns: [{ ...parsed.selectedDesigns[0]!, image: "https://example.com/not-approved.png" }] })).toThrow("Mila catalogue image reference");
  });

  it("rejects sticker prepayment above the server-calculated payable amount", () => {
    expect(() => stickerCheckoutSchema.parse({
      productCategory: "refrigerator", deliveryOption: "courier_dhaka",
      measurements: [{ length: 60, width: 24, quantity: 1, qualityId: "regular" as const }], customerName: "Mila Customer", customerPhone: "01700000000",
      deliveryAddress: "House 1, Road 2, Dhaka 1207", district: "Dhaka", policeStation: "Mohammadpur", locality: "Bosila",
      paymentProvider: "bkash", prepaymentAmount: 671,
    })).toThrow("Prepayment cannot exceed the total payable amount");
  });
});
