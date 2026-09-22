import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { DecorPreview } from "../../drizzle/schema";
import { getDecorPreviewByRequestId, updateDecorPreview } from "../db";
import { generateImage } from "../_core/imageGeneration";
import { invokeLLM } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";
import { storageGet, storageGetSignedUrl } from "../storage";

const requestSchema = z.object({ requestId: z.string().uuid() });

type DecorRecommendation = {
  detectedSubject: string;
  spaceSummary: string;
  styleDirection: string;
  recommendedActions: Array<{ area: string; title: string; detail: string; priority: string }>;
  stickerSuggestion: { material: string; finish: string; placement: string; reason: string };
  wallpaperSuggestion: { material: string; placement: string; reason: string };
  furniturePlacement: string;
  frameAndAccentPlan: string;
  palette: string[];
  assumptions: string[];
  safetyNotice: string;
};

const recommendationSchema = {
  type: "object",
  properties: {
    detectedSubject: { type: "string" },
    spaceSummary: { type: "string" },
    styleDirection: { type: "string" },
    recommendedActions: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          area: { type: "string" },
          title: { type: "string" },
          detail: { type: "string" },
          priority: { type: "string" },
        },
        required: ["area", "title", "detail", "priority"],
        additionalProperties: false,
      },
    },
    stickerSuggestion: {
      type: "object",
      properties: { material: { type: "string" }, finish: { type: "string" }, placement: { type: "string" }, reason: { type: "string" } },
      required: ["material", "finish", "placement", "reason"],
      additionalProperties: false,
    },
    wallpaperSuggestion: {
      type: "object",
      properties: { material: { type: "string" }, placement: { type: "string" }, reason: { type: "string" } },
      required: ["material", "placement", "reason"],
      additionalProperties: false,
    },
    furniturePlacement: { type: "string" },
    frameAndAccentPlan: { type: "string" },
    palette: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
    assumptions: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    safetyNotice: { type: "string" },
  },
  required: ["detectedSubject", "spaceSummary", "styleDirection", "recommendedActions", "stickerSuggestion", "wallpaperSuggestion", "furniturePlacement", "frameAndAccentPlan", "palette", "assumptions", "safetyNotice"],
  additionalProperties: false,
} as const;

function parseRecommendation(value: string | null): DecorRecommendation | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as DecorRecommendation;
  } catch {
    return null;
  }
}

function asGeneratedKey(url: string | undefined) {
  const prefix = "/manus-storage/";
  if (!url?.startsWith(prefix)) throw new Error("Generated preview storage reference was unavailable");
  return decodeURIComponent(url.slice(prefix.length));
}

async function publicPreview(record: DecorPreview) {
  const generatedPreviewUrl = record.generatedPreviewKey ? (await storageGet(record.generatedPreviewKey)).url : null;
  return {
    requestId: record.requestId,
    photoType: record.photoType,
    subjectType: record.subjectType,
    stylePreference: record.stylePreference,
    budgetPreference: record.budgetPreference,
    status: record.status,
    recommendation: parseRecommendation(record.recommendationJson),
    generatedPreviewUrl,
    createdAt: record.createdAt,
  };
}

async function requirePreview(requestId: string) {
  const record = await getDecorPreviewByRequestId(requestId);
  if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "This decor request could not be found." });
  return record;
}

function decoratePrompt(record: DecorPreview) {
  return [
    "You are Mila Interior Solutions' visual decor consultant. Analyze the single customer-supplied photo for decor inspiration only.",
    `Photo type: ${record.photoType}. Subject supplied by customer: ${record.subjectType ?? "not specified"}.`,
    `Style preference: ${record.stylePreference ?? "not specified"}. Budget preference: ${record.budgetPreference ?? "not specified"}.`,
    "Write clear Bengali-first, English-supported customer guidance. Recommend elegant sticker/decor, wallpaper, furniture placement, wall frames or accents only when visually appropriate.",
    "Do not identify people, infer private attributes, make structural or electrical claims, estimate exact dimensions, promise material availability, or present this as an architectural plan. If visibility is limited, state an assumption instead of guessing.",
    "Keep every recommendation practical, specific to the visible photo, and concise. The safety notice must explicitly say a human/site measurement is needed before execution.",
  ].join("\n");
}

function conceptualPreviewPrompt(record: DecorPreview, recommendation: DecorRecommendation) {
  const actions = recommendation.recommendedActions.map((action) => `${action.area}: ${action.title} — ${action.detail}`).join("; ");
  return [
    "Edit the provided customer photo into one photorealistic, concept-only interior decor preview for Mila Interior Solutions.",
    "Preserve the exact room or furniture geometry, perspective, camera angle, light direction, floor, walls, existing object positions, brand labels, and all people or identities. Do not crop, remove, add, or alter people. Do not invent a different room, a new furniture item, measurements, text, watermark, logo, or signage.",
    `Photo type: ${record.photoType}. Style direction: ${recommendation.styleDirection}.`,
    `Apply only visually plausible elements that follow these suggestions: ${actions}.`,
    `Use this surface treatment direction only where appropriate: ${recommendation.stickerSuggestion.material}, ${recommendation.stickerSuggestion.finish}, ${recommendation.stickerSuggestion.placement}.`,
    `Wallpaper direction only where suitable: ${recommendation.wallpaperSuggestion.material}, ${recommendation.wallpaperSuggestion.placement}.`,
    "The result must look like a respectful visual concept over the same supplied image, not a final installation drawing or a promise of exact available materials.",
  ].join("\n");
}

export const decorRouter = router({
  get: publicProcedure.input(requestSchema).query(async ({ input }) => publicPreview(await requirePreview(input.requestId))),

  analyze: publicProcedure.input(requestSchema).mutation(async ({ input }) => {
    const record = await requirePreview(input.requestId);
    if (record.status === "ready" || record.status === "complete") return publicPreview(record);
    if (record.status === "analyzing" || record.status === "generating") {
      throw new TRPCError({ code: "CONFLICT", message: "This decor request is already being prepared." });
    }

    await updateDecorPreview(record.requestId, { status: "analyzing", errorMessage: null });
    try {
      const sourceUrl = await storageGetSignedUrl(record.sourceImageKey);
      const response = await invokeLLM({
        model: "gemini-3-flash-preview",
        maxTokens: 2600,
        messages: [
          { role: "system", content: "Return only JSON matching the provided strict schema." },
          { role: "user", content: [{ type: "text", text: decoratePrompt(record) }, { type: "image_url", image_url: { url: sourceUrl, detail: "high" } }] },
        ],
        response_format: { type: "json_schema", json_schema: { name: "mila_decor_recommendation", strict: true, schema: recommendationSchema } },
      });
      const content = response.choices[0]?.message.content;
      if (typeof content !== "string") throw new Error("Vision analysis returned no structured content");
      const recommendation = JSON.parse(content) as DecorRecommendation;
      const updated = await updateDecorPreview(record.requestId, { status: "ready", recommendationJson: JSON.stringify(recommendation), errorMessage: null });
      if (!updated) throw new Error("Decor request was not available after analysis");
      return publicPreview(updated);
    } catch (error) {
      await updateDecorPreview(record.requestId, { status: "failed", errorMessage: "Analysis could not be completed. Please retry." });
      console.error("[Decor analysis] failed", error instanceof Error ? error.message : "unknown error");
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We could not analyze this photo right now. Please retry shortly." });
    }
  }),

  generatePreview: publicProcedure.input(requestSchema).mutation(async ({ input }) => {
    const record = await requirePreview(input.requestId);
    if (record.generatedPreviewKey && record.status === "complete") return publicPreview(record);
    if (record.status === "generating") throw new TRPCError({ code: "CONFLICT", message: "Your conceptual preview is already being created." });
    const recommendation = parseRecommendation(record.recommendationJson);
    if (!recommendation || (record.status !== "ready" && record.status !== "complete")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Prepare the decor recommendations before requesting a visual preview." });
    }

    await updateDecorPreview(record.requestId, { status: "generating", errorMessage: null });
    try {
      const sourceUrl = await storageGetSignedUrl(record.sourceImageKey);
      const generated = await generateImage({
        prompt: conceptualPreviewPrompt(record, recommendation),
        originalImages: [{ url: sourceUrl, mimeType: record.sourceImageMimeType }],
      });
      const generatedPreviewKey = asGeneratedKey(generated.url);
      const updated = await updateDecorPreview(record.requestId, { status: "complete", generatedPreviewKey, errorMessage: null });
      if (!updated) throw new Error("Decor request was not available after preview generation");
      return publicPreview(updated);
    } catch (error) {
      await updateDecorPreview(record.requestId, { status: "ready", errorMessage: "Visual preview could not be completed. You can retry." });
      console.error("[Decor preview] failed", error instanceof Error ? error.message : "unknown error");
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The visual preview could not be created right now. Your recommendations are still available." });
    }
  }),
});
