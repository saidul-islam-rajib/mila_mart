import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { createDecorPreview } from "./db";
import { storagePut } from "./storage";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 3;
const attempts = new Map<string, number[]>();

type PhotoType = "furniture" | "room";
type DecorUpload = {
  buffer: Buffer;
  contentType: "image/png" | "image/jpeg" | "image/webp";
  extension: "png" | "jpeg" | "webp";
  photoType: PhotoType;
  subjectType: string | null;
  stylePreference: string | null;
  budgetPreference: string | null;
};

function acceptUpload(ip: string) {
  const now = Date.now();
  const current = (attempts.get(ip) ?? []).filter((timestamp) => timestamp > now - WINDOW_MS);
  if (current.length >= MAX_UPLOADS_PER_WINDOW) return false;
  current.push(now);
  attempts.set(ip, current);
  return true;
}

function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || null;
}

/** Decode only the supported small image formats. The raw data URL is never logged or stored in the database. */
export function parseDecorUpload(body: unknown): DecorUpload | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  if (input.consent !== true) return null;
  if (input.photoType !== "furniture" && input.photoType !== "room") return null;
  if (typeof input.dataUrl !== "string") return null;

  const match = input.dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_FILE_BYTES) return null;

  const extension = match[1] as DecorUpload["extension"];
  return {
    buffer,
    contentType: `image/${extension}` as DecorUpload["contentType"],
    extension,
    photoType: input.photoType,
    subjectType: optionalText(input.subjectType, 80),
    stylePreference: optionalText(input.stylePreference, 80),
    budgetPreference: optionalText(input.budgetPreference, 80),
  };
}

export function registerDecorPhotoRoutes(app: Express) {
  app.post("/api/decor-photo", async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!acceptUpload(ip)) {
      return res.status(429).json({ error: "Too many photo uploads. Please try again in a few minutes." });
    }

    const upload = parseDecorUpload(req.body);
    if (!upload) {
      return res.status(400).json({ error: "Upload a PNG, JPEG, or WebP photo smaller than 8 MB and confirm consent." });
    }

    const requestId = randomUUID();
    try {
      const { key } = await storagePut(
        `decor-source/${requestId}/source.${upload.extension}`,
        upload.buffer,
        upload.contentType,
      );
      await createDecorPreview({
        requestId,
        sourceImageKey: key,
        sourceImageMimeType: upload.contentType,
        photoType: upload.photoType,
        subjectType: upload.subjectType,
        stylePreference: upload.stylePreference,
        budgetPreference: upload.budgetPreference,
        consentedAt: new Date(),
        status: "uploaded",
      });
      return res.status(201).json({ requestId });
    } catch (error) {
      console.error("[Decor photo] upload failed", error instanceof Error ? error.message : "unknown error");
      return res.status(500).json({ error: "Your photo could not be prepared. Please retry." });
    }
  });
}
