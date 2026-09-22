import "dotenv/config";
import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerPaymentProofRoutes } from "../paymentProof";
import { registerDecorPhotoRoutes } from "../decorUpload";
import { appRouter } from "../routers";
import { createContext } from "./context";

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ limit: "12mb", extended: true }));
  registerStorageProxy(app);
  registerPaymentProofRoutes(app);
  registerDecorPhotoRoutes(app);
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
