import type { Logger } from "pino";
import type { Role } from "@pulse/types";

declare global {
  namespace Express {
    interface Request {
      /** Correlation id, generated in request-context or taken from X-Request-Id. */
      requestId: string;
      /** Per-request child logger bound with requestId (and userId once authed). */
      log: Logger;
      /** Set by requireAuth. */
      userId?: string;
      userEmail?: string;
      /** Set by requireWorkspace after membership is verified. */
      workspaceId?: string;
      workspaceRole?: Role;
    }
  }
}

export {};
