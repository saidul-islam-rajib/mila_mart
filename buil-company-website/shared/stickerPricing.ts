/** Shared pricing rules for Mila's made-to-measure sticker orders. Values originate from the approved order-flow reference. */
export const STICKER_QUALITIES = [
  { id: "regular", label: "Regular Sticker", bangla: "রেগুলার স্টিকার", rate: 60, note: "Economical & standard finish" },
  { id: "matte-pr", label: "Matte PR Sticker", bangla: "ম্যাট PR স্টিকার", rate: 80, note: "Anti-glare matte finish" },
  { id: "glossy-pr", label: "Glossy PR Sticker", bangla: "গ্লসি PR স্টিকার", rate: 80, note: "Vibrant gloss & shine" },
  { id: "glittery", label: "Glittery Sticker", bangla: "গ্লিটারী স্টিকার", rate: 120, note: "Luxury diamond sparkle" },
  { id: "three-d", label: "3D Sticker", bangla: "3D স্টিকার", rate: 90, note: "Depth & dimensional effect" },
  { id: "reflective", label: "Reflective Sticker", bangla: "রিফ্লেক্টিভ স্টিকার", rate: 90, note: "High-visibility glow" },
] as const;

export const DELIVERY_OPTIONS = [
  { id: "courier_dhaka", label: "Courier delivery — Inside Dhaka", bangla: "কুরিয়ার ডেলিভারি — ঢাকার ভিতরে", charge: 70, mode: "courier" },
  { id: "courier_outside_dhaka", label: "Courier delivery — Outside Dhaka", bangla: "কুরিয়ার ডেলিভারি — ঢাকার বাইরে", charge: 150, mode: "courier" },
  { id: "showroom_pickup", label: "Office / showroom pickup", bangla: "অফিস / শোরুম পিকআপ", charge: 0, mode: "pickup" },
  { id: "dhaka_home_service", label: "Dhaka home service", bangla: "ঢাকা হোম সার্ভিস", charge: 500, mode: "home" },
] as const;

export type StickerQualityId = (typeof STICKER_QUALITIES)[number]["id"];
export type DeliveryOptionId = (typeof DELIVERY_OPTIONS)[number]["id"];
export type StickerMeasurement = { label?: string; qualityId?: StickerQualityId; length?: number; width?: number; quantity?: number; customSquareFeet?: number };

const positiveNumber = (value: number | undefined) => (Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0);
const rounded = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function getStickerQuality(id: StickerQualityId) {
  return STICKER_QUALITIES.find((quality) => quality.id === id) ?? STICKER_QUALITIES[0];
}

export function getDeliveryOption(id: DeliveryOptionId) {
  return DELIVERY_OPTIONS.find((option) => option.id === id) ?? DELIVERY_OPTIONS[0];
}

export function calculateRowSquareFeet(row: StickerMeasurement) {
  const quantity = positiveNumber(row.quantity) || 1;
  const customSquareFeet = positiveNumber(row.customSquareFeet);
  if (customSquareFeet) return rounded(customSquareFeet * quantity);
  return rounded((positiveNumber(row.length) * positiveNumber(row.width) * quantity) / 144);
}

export function calculateStickerLine(row: StickerMeasurement, fallbackQualityId: StickerQualityId = "regular", index = 0) {
  const quality = getStickerQuality(row.qualityId ?? fallbackQualityId);
  const squareFeet = calculateRowSquareFeet(row);
  return {
    label: row.label?.trim() || `Part ${String(index + 1).padStart(2, "0")}`,
    quality,
    quantity: positiveNumber(row.quantity) || 1,
    squareFeet,
    unitPrice: quality.rate,
    lineTotal: rounded(squareFeet * quality.rate),
  };
}

export function calculateStickerOrder(input: { deliveryOptionId: DeliveryOptionId; measurements: StickerMeasurement[]; qualityId?: StickerQualityId }) {
  const delivery = getDeliveryOption(input.deliveryOptionId);
  const lineItems = input.measurements.map((row, index) => calculateStickerLine(row, input.qualityId ?? "regular", index));
  const totalSquareFeet = rounded(lineItems.reduce((total, line) => total + line.squareFeet, 0));
  const productValue = rounded(lineItems.reduce((total, line) => total + line.lineTotal, 0));
  const firstLine = lineItems[0] ?? calculateStickerLine({}, input.qualityId ?? "regular");
  return { quality: firstLine.quality, delivery, lineItems, totalSquareFeet, unitPrice: firstLine.unitPrice, productValue, deliveryCharge: delivery.charge, totalPayable: rounded(productValue + delivery.charge) };
}
