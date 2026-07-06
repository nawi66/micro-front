import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type RequestHandler } from "express";
import helmet from "helmet";
import hpp from "hpp";
import { loadEnv } from "../config/env.js";
import { ForbiddenError } from "../lib/errors.js";

/** Default JSON body limit. Endpoints needing more set their own locally. */
export const DEFAULT_BODY_LIMIT = "100kb";

/**
 * The security stack: helmet (strict CSP even for a JSON API), CORS allowlist,
 * hpp, cookie parser, and a bounded JSON body parser. Returns handlers to be
 * mounted in order in app.ts.
 */
export function securityMiddleware(): RequestHandler[] {
  const env = loadEnv();
  const allowlist = new Set(env.CORS_ORIGINS);

  const corsMw = cors({
    origin(origin, callback) {
      // Non-browser clients (no Origin) are allowed; browsers must be on the allowlist.
      if (!origin || allowlist.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new ForbiddenError("Origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 600,
  });

  return [
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
    corsMw,
    hpp(),
    cookieParser(),
    express.json({ limit: DEFAULT_BODY_LIMIT }),
  ];
}
