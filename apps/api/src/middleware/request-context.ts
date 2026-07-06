import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";

/**
 * Generates a requestId (or reuses X-Request-Id from the LB), attaches a child
 * logger, and echoes the id back in the response header. Runs before pino-http
 * so every request log carries the correlation id.
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const headerId = req.header("x-request-id");
  const requestId = headerId && headerId.length <= 200 ? headerId : randomUUID();
  req.requestId = requestId;
  req.log = logger.child({ requestId });
  res.setHeader("x-request-id", requestId);
  next();
}
