import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { authController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

/**
 * Auth routes. All mounted under /auth so the refresh cookie (Path=/auth) rides
 * along only on these endpoints.
 */
export const authRouter: Router = Router();

authRouter.post("/register", validate({ body: registerSchema }), authController.register);
authRouter.post("/login", validate({ body: loginSchema }), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAuth, authController.me);
