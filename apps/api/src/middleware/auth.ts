import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/errors.js";

/**
 * Requires a valid Bearer access token. Populates req.userId / req.userEmail and
 * rebinds the request logger with userId. Never touches the DB — the JWT is
 * stateless and self-verifying.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing bearer token");
  }
  const token = header.slice("Bearer ".length).trim();
  const claims = verifyAccessToken(token);
  req.userId = claims.sub;
  req.userEmail = claims.email;
  req.log = req.log.child({ userId: claims.sub });
  next();
}
