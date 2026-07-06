import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireWorkspace } from "../../middleware/tenant.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { teamController } from "./team.controller.js";
import {
  changeRoleSchema,
  inviteMemberSchema,
  memberParamsSchema,
} from "./team.schema.js";

/**
 * Mounted at /workspaces/:workspaceId/team (mergeParams). Any member may read
 * the roster; managing members (invite / change role / remove) requires an
 * owner or admin role.
 */
export const teamRouter: Router = Router({ mergeParams: true });

teamRouter.use(requireAuth, requireWorkspace);

teamRouter.get("/", teamController.list);

teamRouter.post(
  "/",
  requireRole("owner", "admin"),
  validate({ body: inviteMemberSchema }),
  teamController.invite,
);

teamRouter.patch(
  "/:memberId",
  requireRole("owner", "admin"),
  validate({ params: memberParamsSchema, body: changeRoleSchema }),
  teamController.changeRole,
);

teamRouter.delete(
  "/:memberId",
  requireRole("owner", "admin"),
  validate({ params: memberParamsSchema }),
  teamController.remove,
);
