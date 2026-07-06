import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireWorkspace } from "../../middleware/tenant.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { tasksController } from "./tasks.controller.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskParamsSchema,
  updateTaskSchema,
} from "./tasks.schema.js";

/**
 * Mounted at /workspaces/:workspaceId/tasks (mergeParams). Every route is
 * authenticated and tenant-guarded; writes additionally require a write role.
 * requireWorkspace validates :workspaceId as an ObjectId before any DB access.
 */
export const tasksRouter: Router = Router({ mergeParams: true });

tasksRouter.use(requireAuth, requireWorkspace);

tasksRouter.get("/", validate({ query: listTasksQuerySchema }), tasksController.list);

tasksRouter.post(
  "/",
  requireRole("owner", "admin", "member"),
  validate({ body: createTaskSchema }),
  tasksController.create,
);

tasksRouter.get(
  "/:taskId",
  validate({ params: taskParamsSchema }),
  tasksController.get,
);

tasksRouter.patch(
  "/:taskId",
  requireRole("owner", "admin", "member"),
  validate({ params: taskParamsSchema, body: updateTaskSchema }),
  tasksController.update,
);

tasksRouter.delete(
  "/:taskId",
  requireRole("owner", "admin", "member"),
  validate({ params: taskParamsSchema }),
  tasksController.remove,
);
