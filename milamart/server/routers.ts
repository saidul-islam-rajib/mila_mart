import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { commerceRouter } from "./routers/commerce";
import { decorRouter } from "./routers/decor";
import { financeRouter } from "./routers/finance";
import { ordersRouter } from "./routers/orders";
import { siteRouter } from "./routers/site";

export const appRouter = router({
    
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  commerce: commerceRouter,
  decor: decorRouter,
  finance: financeRouter,
  orders: ordersRouter,
  site: siteRouter,

  
  
  
  
  
  
});

export type AppRouter = typeof appRouter;
