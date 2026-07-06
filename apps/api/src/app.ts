import express, { type Express, type Request, type Response } from "express";
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger.js";
import { requestContext } from "./middleware/request-context.js";
import { securityMiddleware } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { workspacesRouter } from "./modules/workspaces/workspaces.routes.js";

/**
 * Builds the Express app with the middleware order from §8. Do not reorder:
 * request-context must precede pino-http (so logs carry requestId), and the
 * error handler must be last (so it catches everything).
 */
export function createApp(): Express {
  const app = express();

  // 1. trust proxy — so req.ip / secure cookies work behind the LB.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // 2. request-context — requestId + child logger.
  app.use(requestContext);

  // 3. security — helmet, cors, hpp, cookie parser, bounded body parser.
  app.use(securityMiddleware());

  // 4. pino-http — one structured line per request, using the context from (2).
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as Request).requestId,
      customProps: (req) => ({
        requestId: (req as Request).requestId,
        userId: (req as Request).userId,
        workspaceId: (req as Request).workspaceId,
      }),
      autoLogging: {
        ignore: (req) => req.url === "/health",
      },
    }),
  );

  // 5. routes.
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/workspaces", workspacesRouter);

  // 6. 404.
  app.use(notFoundHandler);

  // 7. error middleware — LAST.
  app.use(errorHandler);

  return app;
}
