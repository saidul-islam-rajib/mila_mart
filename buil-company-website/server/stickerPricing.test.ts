import { describe, expect, it } from "vitest";
import { calculateRowSquareFeet, calculateStickerOrder } from "../shared/stickerPricing";

describe("Mila sticker pricing", () => {
  it("calculates length × width ÷ 144 with quantity", () => {
    expect(calculateRowSquareFeet({ length: 60, width: 24, quantity: 2 })).toBe(20);
  });

  it("uses custom square feet when it is provided", () => {
    expect(calculateRowSquareFeet({ customSquareFeet: 7.5, quantity: 2 })).toBe(15);
  });

  it("adds inside-Dhaka courier charge to the regular sticker quote", () => {
    expect(calculateStickerOrder({
      qualityId: "regular",
      deliveryOptionId: "courier_dhaka",
      measurements: [{ length: 60, width: 24, quantity: 1 }],
    })).toMatchObject({ totalSquareFeet: 10, unitPrice: 60, productValue: 600, deliveryCharge: 70, totalPayable: 670 });
  });

  it("adds line totals correctly when each surface uses a different finish", () => {
    const quote = calculateStickerOrder({
      deliveryOptionId: "dhaka_home_service",
      measurements: [
        { label: "Fridge front", length: 60, width: 24, quantity: 1, qualityId: "three-d" },
        { label: "Table top", length: 30, width: 22, quantity: 1, qualityId: "regular" },
      ],
    });
    expect(quote.lineItems).toMatchObject([
      { label: "Fridge front", squareFeet: 10, unitPrice: 90, lineTotal: 900 },
      { label: "Table top", squareFeet: 4.58, unitPrice: 60, lineTotal: 274.8 },
    ]);
    expect(quote).toMatchObject({ totalSquareFeet: 14.58, productValue: 1174.8, deliveryCharge: 500, totalPayable: 1674.8 });
  });

  it("quotes one selected fridge side using only that side's finish", () => {
    const quote = calculateStickerOrder({
      deliveryOptionId: "showroom_pickup",
      measurements: [
        { label: "Fridge front", length: 60, width: 24, quantity: 1, qualityId: "three-d" },
      ],
    });

    expect(quote).toMatchObject({
      totalSquareFeet: 10,
      productValue: 900,
      deliveryCharge: 0,
      totalPayable: 900,
    });
  });

  it("quotes three fridge sides with independently selected finishes", () => {
    const quote = calculateStickerOrder({
      deliveryOptionId: "courier_dhaka",
      measurements: [
        { label: "Fridge front", length: 60, width: 24, quantity: 1, qualityId: "three-d" },
        { label: "Fridge left side", length: 60, width: 20, quantity: 1, qualityId: "glossy-pr" },
        { label: "Fridge right side", length: 60, width: 20, quantity: 1, qualityId: "matte-pr" },
      ],
    });

    expect(quote.lineItems).toHaveLength(3);
    expect(quote).toMatchObject({
      totalSquareFeet: 26.66,
      productValue: 2232.8,
      deliveryCharge: 70,
      totalPayable: 2302.8,
    });
  });

  it("quotes seven sides for a three-side fridge plus four-side deep freezer", () => {
    const quote = calculateStickerOrder({
      deliveryOptionId: "courier_outside_dhaka",
      measurements: [
        { label: "Fridge front", length: 60, width: 24, quantity: 1, qualityId: "three-d" },
        { label: "Fridge left side", length: 60, width: 20, quantity: 1, qualityId: "three-d" },
        { label: "Fridge right side", length: 60, width: 20, quantity: 1, qualityId: "three-d" },
        { label: "Deep freezer front", length: 48, width: 24, quantity: 1, qualityId: "regular" },
        { label: "Deep freezer left side", length: 48, width: 20, quantity: 1, qualityId: "reflective" },
        { label: "Deep freezer right side", length: 48, width: 20, quantity: 1, qualityId: "reflective" },
        { label: "Deep freezer lid", length: 48, width: 24, quantity: 1, qualityId: "glittery" },
      ],
    });

    expect(quote.lineItems).toHaveLength(7);
    expect(quote).toMatchObject({
      totalSquareFeet: 56,
      productValue: 5040,
      deliveryCharge: 150,
      totalPayable: 5190,
    });
  });
});
