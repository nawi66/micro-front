import type { User } from "@pulse/types";
import { authService } from "../auth/auth.service.js";
import type { ChangePasswordInput, UpdateProfileInput } from "./users.schema.js";

/**
 * Users service — the user-facing view of an account (profile + credentials).
 * The `User` entity is owned by the auth module, so this delegates to
 * authService rather than reaching into its model (§ no cross-module models).
 */
export const usersService = {
  async getProfile(userId: string): Promise<User> {
    return authService.getUserById(userId);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    return authService.updateProfile(userId, input);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    return authService.changePassword(userId, input.currentPassword, input.newPassword);
  },
};
