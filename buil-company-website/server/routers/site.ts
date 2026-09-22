import { z } from "zod";
import { listPublicWebsiteSettings, listWebsiteSettings, upsertWebsiteSetting } from "../db";
import { publicProcedure, router, superAdminProcedure } from "../_core/trpc";

const websiteSettingSchema = z.object({
  settingKey: z.string().trim().regex(/^[a-z][a-z0-9_.-]{1,79}$/i, "Use a short letters/numbers setting key"),
  settingValue: z.string().trim().min(1).max(4000),
  isPublic: z.boolean().default(true),
});

export const siteRouter = router({
  publicSettings: publicProcedure.query(() => listPublicWebsiteSettings()),
  list: superAdminProcedure.query(() => listWebsiteSettings()),
  save: superAdminProcedure.input(websiteSettingSchema).mutation(({ ctx, input }) => upsertWebsiteSetting({ settingKey: input.settingKey, settingValue: input.settingValue, isPublic: input.isPublic ? 1 : 0, updatedBy: ctx.user.openId })),
});
