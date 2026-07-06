import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireWorkspace } from "../../middleware/tenant.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { docsController } from "./docs.controller.js";
import {
  createDocSchema,
  docParamsSchema,
  listDocsQuerySchema,
  updateDocSchema,
} from "./docs.schema.js";

/**
 * Mounted at /workspaces/:workspaceId/docs (mergeParams). Every route is
 * authenticated and tenant-guarded; writes additionally require a write role.
 * requireWorkspace validates :workspaceId as an ObjectId before any DB access.
 */
export const docsRouter: Router = Router({ mergeParams: true });

docsRouter.use(requireAuth, requireWorkspace);

docsRouter.get("/", validate({ query: listDocsQuerySchema }), docsController.list);

docsRouter.post(
  "/",
  requireRole("owner", "admin", "member"),
  validate({ body: createDocSchema }),
  docsController.create,
);

docsRouter.get("/:docId", validate({ params: docParamsSchema }), docsController.get);

docsRouter.patch(
  "/:docId",
  requireRole("owner", "admin", "member"),
  validate({ params: docParamsSchema, body: updateDocSchema }),
  docsController.update,
);

docsRouter.delete(
  "/:docId",
  requireRole("owner", "admin", "member"),
  validate({ params: docParamsSchema }),
  docsController.remove,
);
