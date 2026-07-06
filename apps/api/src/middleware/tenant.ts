import type { NextFunction, Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { WorkspaceMemberModel } from "../modules/workspaces/workspaces.model.js";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "../lib/errors.js";

/**
 * Requires the authenticated user to be a member of :workspaceId. On success it
 * pins req.workspaceId and req.workspaceRole so downstream queries can filter by
 * tenant and rbac can gate by role. Must run after requireAuth.
 */
export async function requireWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) throw new UnauthorizedError();

  const workspaceId = req.params.workspaceId;
  if (typeof workspaceId !== "string" || !isValidObjectId(workspaceId)) {
    throw new BadRequestError("Invalid workspace id");
  }

  const membership = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId: req.userId,
  }).lean();

  if (!membership) {
    // Generic — never reveal whether the workspace exists.
    throw new ForbiddenError("You do not have access to this workspace");
  }

  req.workspaceId = workspaceId;
  req.workspaceRole = membership.role;
  req.log = req.log.child({ workspaceId });
  next();
}
