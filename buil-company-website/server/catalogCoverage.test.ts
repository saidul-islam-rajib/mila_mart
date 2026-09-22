import { describe, expect, it } from "vitest";
import { stickerProducts, wallpaperGalleryEntries } from "@/data/catalog";

const stickerCategoryMinimums: Record<string, number> = {
  refrigerator: 15,
  "deep-freezer": 15,
  almirah: 15,
  wardrobe: 15,
  "shoe-rack": 15,
  door: 15,
  kitchen: 10,
  table: 10,
  glass: 10,
  vehicle: 10,
};

describe("customer-facing catalog coverage", () => {
  it("keeps every Sticker sub-category at its requested minimum", () => {
    for (const [category, minimum] of Object.entries(stickerCategoryMinimums)) {
      const count = stickerProducts.filter(product => product.category === category).length;
      expect(count, `${category} gallery count`).toBeGreaterThanOrEqual(minimum);
    }
  });

  it("keeps ten image-backed entries in each Wallpaper sub-category", () => {
    const wallpaperGroups = [
      { name: "3D Wallpaper", start: 4, end: 14 },
      { name: "Emboss Wallpaper", start: 14, end: 24 },
      { name: "Fabric Wallpaper", start: 24, end: 34 },
      { name: "PVC Wallpaper", start: 34, end: 44 },
    ];

    for (const group of wallpaperGroups) {
      const entries = wallpaperGalleryEntries.slice(group.start, group.end);
      expect(entries, `${group.name} gallery count`).toHaveLength(10);
      expect(entries.every(entry => Boolean(entry.image)), `${group.name} images`).toBe(true);
    }
  });
});
