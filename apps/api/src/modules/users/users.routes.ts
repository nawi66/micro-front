import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { usersController } from "./users.controller.js";
import { changePasswordSchema, updateProfileSchema } from "./users.schema.js";

/**
 * Mounted at /users. These are account-scoped (not workspace-scoped): they act
 * on the authenticated user only, so requireAuth is the sole guard.
 */
export const usersRouter: Router = Router();

usersRouter.use(requireAuth);

usersRouter.get("/me", usersController.me);
usersRouter.patch("/me", validate({ body: updateProfileSchema }), usersController.updateMe);
usersRouter.post(
  "/me/password",
  validate({ body: changePasswordSchema }),
  usersController.changePassword,
);
