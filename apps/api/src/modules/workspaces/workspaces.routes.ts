import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireWorkspace } from "../../middleware/tenant.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { tasksRouter } from "../tasks/tasks.routes.js";
import { docsRouter } from "../docs/docs.routes.js";
import { teamRouter } from "../team/team.routes.js";
import { adminRouter } from "../admin/admin.routes.js";
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

// Nested resources inherit the workspace tenant boundary (each runs its own
// requireAuth + requireWorkspace, so they are safe mounted standalone too).
workspacesRouter.use("/:workspaceId/tasks", tasksRouter);
workspacesRouter.use("/:workspaceId/docs", docsRouter);
workspacesRouter.use("/:workspaceId/team", teamRouter);
workspacesRouter.use("/:workspaceId/admin", adminRouter);
