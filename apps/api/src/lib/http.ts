import type { Request } from "express";
import { BadRequestError } from "./errors.js";

/**
 * Read a single string path param. Express 5 types params as `string | string[]`;
 * after Zod validation they are plain strings, but this narrows safely.
 */
export function pathParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new BadRequestError(`Missing path parameter: ${name}`);
  }
  return value;
}
