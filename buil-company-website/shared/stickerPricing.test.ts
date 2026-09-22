import { describe, expect, it } from "vitest";
import { calculateRowSquareFeet, calculateStickerOrder } from "./stickerPricing";

describe("Mila sticker pricing", () => {
  it("calculates length × width ÷ 144 with quantity", () => {
    expect(calculateRowSquareFeet({ length: 60, width: 24, quantity: 2 })).toBe(20);
  });
  it("uses custom square feet when it is provided", () => {
    expect(calculateRowSquareFeet({ customSquareFeet: 7.5, quantity: 2 })).toBe(15);
  });
  it("adds inside-Dhaka courier charge to the regular sticker quote", () => {
    expect(calculateStickerOrder({ qualityId: "regular", deliveryOptionId: "courier_dhaka", measurements: [{ length: 60, width: 24, quantity: 1 }] })).toMatchObject({ totalSquareFeet: 10, unitPrice: 60, productValue: 600, deliveryCharge: 70, totalPayable: 670 });
  });
});
