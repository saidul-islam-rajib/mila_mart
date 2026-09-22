import { z } from "zod";

export const productCategorySchema = z.enum([
  "stickers",
  "wallpapers",
  "home_deco",
  "fashion_mens",
  "fashion_womens",
  "fashion_bags",
  "fashion_cosmetics",
  "new_arrivals",
]);

const imageSourceSchema = z.string().trim().min(1).refine(
  (value) => value.startsWith("/manus-storage/") || value.startsWith("https://drive.google.com/") || value.startsWith("https://www.dropbox.com/"),
  "Image must be an approved storage reference or a Drive/Dropbox source URL",
);

export const productVariantSchema = z.object({
  name: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(120),
  priceBdt: z.number().int().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
}).strict();

export const productCatalogIntakeSchema = z.object({
  handle: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL handle"),
  titleEn: z.string().trim().min(2).max(120),
  titleBn: z.string().trim().min(2).max(120),
  category: productCategorySchema,
  descriptionEn: z.string().trim().min(10).max(2000),
  descriptionBn: z.string().trim().min(10).max(2000),
  priceBdt: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  inventoryStatus: z.enum(["in_stock", "made_to_order", "preorder"]),
  variants: z.array(productVariantSchema).max(20).default([]),
  gallerySources: z.array(imageSourceSchema).min(10).max(12),
  approvedForPublish: z.literal(true),
}).strict();

export type ProductCatalogIntake = z.infer<typeof productCatalogIntakeSchema>;

export function validateProductCatalogIntake(input: unknown) {
  return productCatalogIntakeSchema.safeParse(input);
}
