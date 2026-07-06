import { pino } from "pino";
import { loadEnv } from "./env.js";

const env = loadEnv();

/**
 * Structured JSON logger. Redaction covers every field that could carry a
 * secret — no secret ever reaches a log line (§9.5).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "totpSecret",
      "resetToken",
      "pepper",
      "secret",
    ],
    censor: "[redacted]",
  },
  base: undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
