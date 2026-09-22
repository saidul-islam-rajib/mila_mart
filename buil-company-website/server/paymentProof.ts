import type { Express, Request, Response } from "express";
import { storagePut } from "./storage";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 5;
const attempts = new Map<string, number[]>();

function acceptUpload(ip: string) {
  const now = Date.now();
  const current = (attempts.get(ip) ?? []).filter((timestamp) => timestamp > now - WINDOW_MS);
  if (current.length >= MAX_UPLOADS_PER_WINDOW) return false;
  current.push(now); attempts.set(ip, current); return true;
}

function decodeProof(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_FILE_BYTES) return null;
  return { buffer, subtype: match[1], contentType: `image/${match[1]}` };
}

export function registerPaymentProofRoutes(app: Express) {
  app.post("/api/payment-proof", async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!acceptUpload(ip)) return res.status(429).json({ error: "Too many uploads. Please try again later." });
    const proof = decodeProof(req.body?.dataUrl);
    if (!proof) return res.status(400).json({ error: "Upload a PNG, JPEG, or WebP image smaller than 4 MB." });
    try {
      const { key } = await storagePut(`payment-proofs/${new Date().toISOString().slice(0, 10)}/proof.${proof.subtype}`, proof.buffer, proof.contentType);
      return res.status(201).json({ key });
    } catch (error) {
      console.error("[Payment proof] upload failed", error);
      return res.status(500).json({ error: "Payment proof could not be uploaded. Please retry." });
    }
  });
}
