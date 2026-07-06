import jwt from "jsonwebtoken";
import { loadEnv } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";

export interface AccessTokenClaims {
  sub: string; // userId
  email: string;
}

/**
 * Sign a short-lived access JWT (HS256). The first configured secret signs;
 * verification accepts any configured secret, enabling zero-downtime rotation.
 */
export function signAccessToken(claims: AccessTokenClaims): {
  token: string;
  expiresIn: number;
} {
  const env = loadEnv();
  const secret = env.JWT_ACCESS_SECRET[0];
  if (!secret) throw new Error("No JWT_ACCESS_SECRET configured");
  const expiresIn = env.JWT_ACCESS_TTL_SECONDS;
  const token = jwt.sign(claims, secret, {
    algorithm: "HS256",
    expiresIn,
  });
  return { token, expiresIn };
}

/** Verify an access token against every configured secret. Throws on failure. */
export function verifyAccessToken(token: string): AccessTokenClaims {
  const env = loadEnv();
  for (const secret of env.JWT_ACCESS_SECRET) {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
      if (
        typeof decoded === "object" &&
        decoded !== null &&
        typeof decoded.sub === "string" &&
        typeof (decoded as Record<string, unknown>).email === "string"
      ) {
        return { sub: decoded.sub, email: (decoded as { email: string }).email };
      }
    } catch {
      // try the next secret
    }
  }
  throw new UnauthorizedError("Invalid or expired access token");
}
