import { describe, expect, it } from "vitest";
import { parseDecorUpload } from "./decorUpload";

const imageDataUrl = `data:image/png;base64,${Buffer.from("small test image").toString("base64")}`;
const oversizedImageDataUrl = `data:image/jpeg;base64,${Buffer.alloc(8 * 1024 * 1024 + 1).toString("base64")}`;

describe("decor photo upload validation", () => {
  it("accepts an opted-in furniture PNG and keeps only clean metadata", () => {
    const parsed = parseDecorUpload({
      dataUrl: imageDataUrl,
      consent: true,
      photoType: "furniture",
      subjectType: "  Refrigerator  ",
      stylePreference: "Modern",
      budgetPreference: "Balanced",
    });

    expect(parsed).toMatchObject({
      photoType: "furniture",
      contentType: "image/png",
      subjectType: "Refrigerator",
      stylePreference: "Modern",
      budgetPreference: "Balanced",
    });
  });

  it("rejects unconsented, unsupported, or oversized uploads", () => {
    expect(parseDecorUpload({ dataUrl: imageDataUrl, consent: false, photoType: "room" })).toBeNull();
    expect(parseDecorUpload({ dataUrl: "data:image/gif;base64,AAAA", consent: true, photoType: "room" })).toBeNull();
    expect(parseDecorUpload({ dataUrl: "data:application/pdf;base64,AAAA", consent: true, photoType: "room" })).toBeNull();
    expect(parseDecorUpload({ dataUrl: oversizedImageDataUrl, consent: true, photoType: "room" })).toBeNull();
  });
});
