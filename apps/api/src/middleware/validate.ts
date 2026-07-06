import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { ValidationError } from "../lib/errors.js";

interface Schemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

function flatten(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "(root)";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/**
 * Validates body/params/query against `.strict()` Zod schemas and replaces the
 * request values with the parsed (coerced, stripped) output. Unknown fields
 * reject. In Express 5 `req.query` is getter-only, so we redefine it.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError("Request validation failed", flatten(err));
      }
      throw err;
    }
  };
}
