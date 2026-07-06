import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireWorkspace } from "../../middleware/tenant.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { tasksRouter } from "../tasks/tasks.routes.js";
import { workspacesController } from "./workspaces.controller.js";
import {
  addMemberSchema,
  createWorkspaceSchema,
  workspaceParamsSchema,
} from "./workspaces.schema.js";

export const workspacesRouter: Router = Router();

// Collection routes — membership is per-user, not per-workspace.
workspacesRouter.post(
  "/",
  requireAuth,
  validate({ body: createWorkspaceSchema }),
  workspacesController.create,
);
workspacesRouter.get("/", requireAuth, workspacesController.list);

// Single-workspace routes — every one runs the tenant guard.
workspacesRouter.get(
  "/:workspaceId",
  requireAuth,
  validate({ params: workspaceParamsSchema }),
  requireWorkspace,
  workspacesController.get,
);

workspacesRouter.get(
  "/:workspaceId/members",
  requireAuth,
  validate({ params: workspaceParamsSchema }),
  requireWorkspace,
  workspacesController.listMembers,
);

workspacesRouter.post(
  "/:workspaceId/members",
  requireAuth,
  validate({ params: workspaceParamsSchema }),
  requireWorkspace,
  requireRole("owner", "admin"),
  validate({ body: addMemberSchema }),
  workspacesController.addMember,
);

// Tasks are nested under a workspace and inherit its tenant boundary.
workspacesRouter.use("/:workspaceId/tasks", tasksRouter);
