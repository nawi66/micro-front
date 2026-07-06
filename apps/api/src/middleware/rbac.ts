import type { NextFunction, Request, Response } from "express";
import type { Role } from "@pulse/types";
import { ForbiddenError } from "../lib/errors.js";

/**
 * Requires req.workspaceRole to be one of `allowed`. Must run after
 * requireWorkspace, which sets the role. Role checks are explicit allowlists —
 * never "not viewer".
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.workspaceRole;
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenError("Insufficient role for this action");
    }
    next();
  };
}
