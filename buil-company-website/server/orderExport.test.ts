import { describe, expect, it } from "vitest";
import { createOrderCsv, createOrderExportRows } from "./db";

const order = { orderNumber: "MLA-TEST-001", businessOrderId: "131656", createdAt: new Date("2026-09-03T00:00:00.000Z"), status: "new", productSummary: "Refrigerator Sticker", productCode: null, selectedDesigns: '[{"english":"Lily Floral"}]', stickerMeasurements: '[{"label":"Front","length":60,"width":24}]', stickerType: "mixed", calculatedSquareFeet: "10.00", unitPrice: "60.00", deliveryMode: "home", deliveryOption: "home_service_dhaka", deliveryCharge: "500.00", customerName: "Test Customer", customerPhone: "01700000000", customerEmail: null, district: "Dhaka", policeStation: "Mirpur", locality: "Mirpur-10", deliveryAddress: "House 1\nRoad 2", serviceSpecifications: "Install after 6pm", preferredServiceTime: null, assignedTo: null, followUpAt: null, complaintNote: null, paymentProvider: "cod", paymentMethod: "cod", paymentReference: null, paymentStatus: "unpaid", orderValue: "600.00", prepaymentAmount: "0.00" } as any;

describe("order export", () => {
  it("keeps required customer/order columns in an organised row", () => {
    const row = createOrderExportRows([order])[0];
    expect(row).toMatchObject({ order_id: "MLA-TEST-001", selected_designs: "[{\"english\":\"Lily Floral\"}]", delivery_option: "home_service_dhaka", customer_phone: "01700000000" });
  });
  it("writes Excel-compatible quoted CSV and flattens line breaks", () => {
    const csv = createOrderCsv([order]);
    expect(csv).toContain('"House 1 | Road 2"');
    expect(csv.split("\n")).toHaveLength(2);
  });
});
