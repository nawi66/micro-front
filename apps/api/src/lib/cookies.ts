import type { CookieOptions, Response } from "express";
import { loadEnv } from "../config/env.js";

export const REFRESH_COOKIE = "rt";
const REFRESH_PATH = "/auth";

/**
 * The refresh cookie is the only cookie in play: HttpOnly + Secure +
 * SameSite=Strict + Path=/auth. That scoping is what mitigates CSRF (§9.4).
 */
function baseCookieOptions(): CookieOptions {
  const env = loadEnv();
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "strict",
    path: REFRESH_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setRefreshCookie(res: Response, token: string, ttlMs: number): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseCookieOptions(), maxAge: ttlMs });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions());
}
