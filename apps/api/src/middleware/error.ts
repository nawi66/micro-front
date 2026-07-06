import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

// jsonwebtoken is CommonJS; its error classes aren't exposed as ESM named
// exports, so pull them off the default import.
const { JsonWebTokenError, TokenExpiredError } = jwt;

/** 404 for unmatched routes — funnelled through the error handler. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "not_found", message: "Route not found" });
}

interface ErrorBody {
  error: string;
  message?: string;
  details?: unknown;
  requestId: string;
}

/**
 * Terminal error middleware (§9.6). Logs with correlation id + stack, maps known
 * error types to safe responses, and collapses everything else to a generic 500
 * that leaks no message or stack.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-arg shape
  _next: NextFunction,
): void {
  const requestId = req.requestId ?? "unknown";

  if (res.headersSent) return;

  // Known, safe-to-surface application errors.
  if (err instanceof AppError) {
    if (err.status >= 500) {
      req.log?.error({ err, code: err.code }, "app_error");
    } else {
      req.log?.warn({ code: err.code, status: err.status }, "handled_error");
    }
    const body: ErrorBody = { error: err.code, message: err.message, requestId };
    if (err.details !== undefined) body.details = err.details;
    res.status(err.status).json(body);
    return;
  }

  // Zod errors that escaped validate().
  if (err instanceof ZodError) {
    res.status(400).json({ error: "validation_error", message: "Invalid input", requestId });
    return;
  }

  // JWT verification errors.
  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    res.status(401).json({ error: "unauthorized", message: "Invalid token", requestId });
    return;
  }

  // Mongoose validation / cast — never forward the raw message (leaks schema).
  if (
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.CastError ||
    err instanceof mongoose.Error.StrictModeError
  ) {
    req.log?.warn({ name: (err as Error).name }, "db_validation_error");
    res.status(400).json({ error: "bad_request", message: "Invalid request", requestId });
    return;
  }

  // Duplicate key.
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({ error: "conflict", message: "Resource already exists", requestId });
    return;
  }

  // Unknown — log everything, reveal nothing.
  req.log?.error({ err }, "unhandled_error");
  res.status(500).json({ error: "internal_error", requestId });
}
