import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireWorkspace } from "../../middleware/tenant.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { adminController } from "./admin.controller.js";
import { updateSettingsSchema } from "./admin.schema.js";

/**
 * Mounted at /workspaces/:workspaceId/admin (mergeParams). Reading the overview
 * and editing settings require owner or admin; the danger-zone delete is owner
 * only.
 */
export const adminRouter: Router = Router({ mergeParams: true });

adminRouter.use(requireAuth, requireWorkspace);

adminRouter.get("/overview", requireRole("owner", "admin"), adminController.overview);

adminRouter.patch(
  "/settings",
  requireRole("owner", "admin"),
  validate({ body: updateSettingsSchema }),
  adminController.updateSettings,
);

adminRouter.delete("/", requireRole("owner"), adminController.remove);
