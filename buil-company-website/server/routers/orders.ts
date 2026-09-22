import { z } from "zod";
import { calculateStickerOrder, DELIVERY_OPTIONS, STICKER_QUALITIES, type DeliveryOptionId, type StickerMeasurement, type StickerQualityId } from "@shared/stickerPricing";
import { createManualOrder, createOrderCsv, findManualOrderForCustomer, getManualOrderSummary, listManualOrders, normalizePhoneNumber, updateManualOrderStatus } from "../db";
import { publicProcedure, router, staffProcedure } from "../_core/trpc";

const orderStatusSchema = z.enum(["new", "confirmed", "processing", "delivered", "cancelled"]);
const paymentStatusSchema = z.enum(["unpaid", "partial", "paid"]);
const paymentMethodSchema = z.enum(["cod", "mobile_banking", "bank_transfer", "online_card", "other"]);
const paymentProviderSchema = z.enum(["cod", "bkash", "nagad", "rocket", "bank_transfer", "card"]);
const sourceSchema = z.enum(["website", "phone", "whatsapp", "walk_in"]);
const deliveryModeSchema = z.enum(["home", "courier", "pickup"]);
const stickerQualitySchema = z.enum(["regular", "matte-pr", "glossy-pr", "glittery", "three-d", "reflective"]);
const deliveryOptionSchema = z.enum(["courier_dhaka", "courier_outside_dhaka", "showroom_pickup", "dhaka_home_service"]);
const MAX_CUSTOM_MEASUREMENTS = 50;
const approvedDesignImageSchema = z.string().trim().regex(/^\/manus-storage\/[\w.-]+$/, "Use a Mila catalogue image reference");
const selectedDesignSchema = z.object({
  id: z.string().trim().min(2).max(160),
  kind: z.enum(["sticker", "wallpaper"]),
  category: z.string().trim().min(2).max(120),
  english: z.string().trim().min(2).max(160),
  bangla: z.string().trim().max(160).optional().or(z.literal("")),
  image: approvedDesignImageSchema.optional(),
});

export const createManualOrderSchema = z.object({
  businessOrderId: z.string().trim().max(64).optional().or(z.literal("")),
  customerName: z.string().trim().min(2).max(160), customerPhone: z.string().trim().min(6).max(40), customerEmail: z.string().trim().email().max(320).optional().or(z.literal("")),
  deliveryAddress: z.string().trim().max(3000).optional().or(z.literal("")), district: z.string().trim().max(120).optional().or(z.literal("")), policeStation: z.string().trim().max(120).optional().or(z.literal("")), locality: z.string().trim().max(160).optional().or(z.literal("")),
  productCode: z.string().trim().max(80).optional().or(z.literal("")), productSummary: z.string().trim().min(2).max(5000), serviceSpecifications: z.string().trim().max(8000).optional().or(z.literal("")), dimensions: z.string().trim().max(200).optional().or(z.literal("")), assignedTo: z.string().trim().max(160).optional().or(z.literal("")), internalNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(999).default(1), unitLabel: z.string().trim().min(1).max(30).default("pcs"), source: sourceSchema.default("phone"), deliveryMode: deliveryModeSchema.default("courier"), preferredServiceTime: z.string().trim().max(500).optional().or(z.literal("")),
  orderValue: z.coerce.number().min(0).max(999999999), deliveryCharge: z.coerce.number().min(0).max(999999999).default(0), prepaymentAmount: z.coerce.number().min(0).max(999999999).default(0), paymentMethod: paymentMethodSchema.default("cod"), paymentStatus: paymentStatusSchema.default("unpaid"),
}).refine((data) => data.prepaymentAmount <= data.orderValue + data.deliveryCharge, { path: ["prepaymentAmount"], message: "Prepayment cannot exceed the total payable amount" }).refine((data) => data.orderValue + data.deliveryCharge > 0, { path: ["orderValue"], message: "Enter the product price and delivery charge before placing the order" });

const measurementSchema = z.object({
  label: z.string().trim().max(100).optional().or(z.literal("")), qualityId: stickerQualitySchema.default("regular"), length: z.coerce.number().min(0).max(1000).optional(), width: z.coerce.number().min(0).max(1000).optional(), quantity: z.coerce.number().int().min(1).max(200).default(1), customSquareFeet: z.coerce.number().min(0).max(100000).optional(),
}).superRefine((value, ctx) => {
  const hasCustom = Boolean(value.customSquareFeet && value.customSquareFeet > 0);
  const hasDimensions = Boolean(value.length && value.length > 0 && value.width && value.width > 0);
  if (!hasCustom && !hasDimensions) ctx.addIssue({ code: "custom", message: "Enter length and width, or custom square feet" });
});

export const stickerCheckoutSchema = z.object({
  productCategory: z.string().trim().min(2).max(120), productCode: z.string().trim().max(80).optional().or(z.literal("")), selectedDesigns: z.array(selectedDesignSchema).max(12).default([]), measurements: z.array(measurementSchema).min(1).max(MAX_CUSTOM_MEASUREMENTS), deliveryOption: deliveryOptionSchema,
  customerName: z.string().trim().min(2).max(160), customerPhone: z.string().trim().min(6).max(40), customerEmail: z.string().trim().email().max(320).optional().or(z.literal("")), deliveryAddress: z.string().trim().min(8).max(3000), district: z.string().trim().min(2).max(120), policeStation: z.string().trim().min(2).max(120), locality: z.string().trim().min(2).max(160), specialInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
  paymentProvider: paymentProviderSchema, prepaymentAmount: z.coerce.number().min(0).max(999999999).default(0), paymentReference: z.string().trim().max(160).optional().or(z.literal("")), paymentProofKey: z.string().trim().max(512).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  const calculation = calculateStickerOrder({ deliveryOptionId: value.deliveryOption, measurements: value.measurements as StickerMeasurement[] });
  if (calculation.totalSquareFeet <= 0) ctx.addIssue({ code: "custom", path: ["measurements"], message: "Your total sticker area must be greater than zero" });
  if (value.prepaymentAmount > calculation.totalPayable) ctx.addIssue({ code: "custom", path: ["prepaymentAmount"], message: "Prepayment cannot exceed the total payable amount" });
});

const orderFiltersSchema = z.object({ search: z.string().trim().max(160).optional(), status: orderStatusSchema.optional(), paymentStatus: paymentStatusSchema.optional(), source: sourceSchema.optional(), deliveryMode: deliveryModeSchema.optional() }).optional();
export const lookupOrderSchema = z.object({ orderNumber: z.string().trim().regex(/^(MLA-\d{8,14}|\d{4,64})$/, "Use the order number shown in your confirmation"), customerPhone: z.string().trim().min(6).max(40) });
const newOrderNumber = () => `MLA-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;
const providerToPaymentMethod = (provider: z.infer<typeof paymentProviderSchema>): z.infer<typeof paymentMethodSchema> => provider === "cod" ? "cod" : provider === "card" ? "online_card" : provider === "bank_transfer" ? "bank_transfer" : "mobile_banking";

export const ordersRouter = router({
  summary: staffProcedure.query(() => getManualOrderSummary()),
  list: staffProcedure.input(orderFiltersSchema).query(({ input }) => listManualOrders(input)),
  exportCsv: staffProcedure.input(orderFiltersSchema).query(async ({ input }) => {
    const orders = await listManualOrders(input);
    return { fileName: `mila-orders-${new Date().toISOString().slice(0, 10)}.csv`, csv: createOrderCsv(orders), rowCount: orders.length };
  }),
  create: staffProcedure.input(createManualOrderSchema).mutation(async ({ input }) => createManualOrder({ orderNumber: newOrderNumber(), businessOrderId: input.businessOrderId || null, customerName: input.customerName, customerPhone: normalizePhoneNumber(input.customerPhone), customerEmail: input.customerEmail || null, deliveryAddress: input.deliveryAddress || null, district: input.district || null, policeStation: input.policeStation || null, locality: input.locality || null, productCode: input.productCode || null, productSummary: input.productSummary, serviceSpecifications: input.serviceSpecifications || null, dimensions: input.dimensions || null, assignedTo: input.assignedTo || null, internalNotes: input.internalNotes || null, quantity: input.quantity, unitLabel: input.unitLabel, source: input.source, deliveryMode: input.deliveryMode, preferredServiceTime: input.preferredServiceTime || null, status: "new", paymentMethod: input.paymentMethod, paymentStatus: input.paymentStatus, orderValue: input.orderValue.toFixed(2), deliveryCharge: input.deliveryCharge.toFixed(2), prepaymentAmount: input.prepaymentAmount.toFixed(2) })),
  placeStickerOrder: publicProcedure.input(stickerCheckoutSchema).mutation(async ({ input }) => {
    const calculation = calculateStickerOrder({ deliveryOptionId: input.deliveryOption as DeliveryOptionId, measurements: input.measurements as StickerMeasurement[] });
    const paymentStatus = input.prepaymentAmount >= calculation.totalPayable ? "paid" : input.prepaymentAmount > 0 ? "partial" : "unpaid";
    const firstDimension = input.measurements.find((row) => row.length && row.width);
    const requirements = [
      input.selectedDesigns.length ? `Selected designs: ${input.selectedDesigns.map((design) => `${design.english} (${design.id})`).join(", ")}` : "",
      ...calculation.lineItems.map((line, index) => `${index + 1}. ${line.label} · ${line.quality.label} · ${line.squareFeet} sqft × ৳${line.unitPrice} = ৳${line.lineTotal}`),
      input.specialInstructions ? `Instructions: ${input.specialInstructions}` : "",
    ].filter(Boolean).join("\n");
    const uniqueQualityIds = Array.from(new Set(calculation.lineItems.map((line) => line.quality.id)));
    const order = await createManualOrder({ orderNumber: newOrderNumber(), businessOrderId: null, customerName: input.customerName, customerPhone: normalizePhoneNumber(input.customerPhone), customerEmail: input.customerEmail || null, deliveryAddress: input.deliveryAddress, district: input.district, policeStation: input.policeStation, locality: input.locality, productCode: input.productCode || null, productSummary: input.productCategory, selectedDesigns: JSON.stringify(input.selectedDesigns), designSourceUrl: "https://drive.google.com/drive/folders/1dbOi0ArZKFbRGtIEo4kRqV2ZXlqM-F_f?usp=sharing", serviceSpecifications: requirements, stickerType: uniqueQualityIds.length === 1 ? uniqueQualityIds[0] : "mixed-quality", stickerMeasurements: JSON.stringify(input.measurements), calculatedSquareFeet: calculation.totalSquareFeet.toFixed(2), unitPrice: uniqueQualityIds.length === 1 ? calculation.unitPrice.toFixed(2) : null, customSquareFeet: input.measurements.reduce((total, row) => total + (Number(row.customSquareFeet) || 0) * (Number(row.quantity) || 1), 0).toFixed(2), dimensions: firstDimension ? `${firstDimension.length} × ${firstDimension.width} inch` : null, quantity: input.measurements.reduce((total, row) => total + row.quantity, 0), unitLabel: "sqft", source: "website", deliveryMode: calculation.delivery.mode, deliveryOption: input.deliveryOption, preferredServiceTime: null, status: "new", paymentMethod: providerToPaymentMethod(input.paymentProvider), paymentProvider: input.paymentProvider, paymentReference: input.paymentReference || null, paymentProofKey: input.paymentProofKey || null, paymentStatus, orderValue: calculation.productValue.toFixed(2), deliveryCharge: calculation.deliveryCharge.toFixed(2), prepaymentAmount: input.prepaymentAmount.toFixed(2) });
    return { orderNumber: order.orderNumber, selectedDesigns: input.selectedDesigns, lineItems: calculation.lineItems, totalSquareFeet: calculation.totalSquareFeet, productValue: calculation.productValue, deliveryCharge: calculation.deliveryCharge, totalPayable: calculation.totalPayable, duePayment: Math.max(calculation.totalPayable - input.prepaymentAmount, 0) };
  }),
  quoteStickerOrder: publicProcedure.input(z.object({ deliveryOption: deliveryOptionSchema, measurements: z.array(measurementSchema).max(MAX_CUSTOM_MEASUREMENTS) })).query(({ input }) => calculateStickerOrder({ deliveryOptionId: input.deliveryOption as DeliveryOptionId, measurements: input.measurements as StickerMeasurement[] })),
  updateStatus: staffProcedure.input(z.object({ orderNumber: z.string().min(1).max(32), status: orderStatusSchema.optional(), paymentMethod: paymentMethodSchema.optional(), paymentStatus: paymentStatusSchema.optional(), prepaymentAmount: z.coerce.number().min(0).max(999999999).optional(), deliveryCharge: z.coerce.number().min(0).max(999999999).optional(), deliveryMode: deliveryModeSchema.optional(), preferredServiceTime: z.string().trim().max(500).optional(), assignedTo: z.string().trim().max(160).optional(), internalNotes: z.string().trim().max(4000).optional(), complaintNote: z.string().trim().max(4000).optional(), followUpAt: z.coerce.date().nullable().optional() })).mutation(async ({ input }) => { const { orderNumber, prepaymentAmount, deliveryCharge, ...updates } = input; return updateManualOrderStatus(orderNumber, { ...updates, prepaymentAmount: prepaymentAmount === undefined ? undefined : prepaymentAmount.toFixed(2), deliveryCharge: deliveryCharge === undefined ? undefined : deliveryCharge.toFixed(2) }); }),
  lookup: publicProcedure.input(lookupOrderSchema).query(async ({ input }) => { const order = await findManualOrderForCustomer(input.orderNumber, normalizePhoneNumber(input.customerPhone)); if (!order) return null; return { orderNumber: order.orderNumber, productSummary: order.productSummary, quantity: order.quantity, unitLabel: order.unitLabel, serviceSpecifications: order.serviceSpecifications, status: order.status, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, deliveryMode: order.deliveryMode, preferredServiceTime: order.preferredServiceTime, createdAt: order.createdAt }; }),
});
