import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { loadEnv } from "../config/env.js";

/** Generate an opaque random token (base64url). Default 32 bytes of entropy. */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * HMAC-SHA256 a secret token with the server pepper before storing it at rest.
 * Refresh tokens and password-reset tokens are never stored in plaintext.
 */
export function hashToken(token: string): string {
  const { REFRESH_TOKEN_PEPPER } = loadEnv();
  return createHmac("sha256", REFRESH_TOKEN_PEPPER).update(token).digest("hex");
}

/** Constant-time comparison of two hex digests of equal length. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
