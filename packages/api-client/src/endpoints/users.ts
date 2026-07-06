import type { User } from "@pulse/types";
import type { HttpClient } from "../client.js";
import { userEnvelope } from "../schemas.js";

export interface UpdateProfileInput {
  name?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function userEndpoints(http: HttpClient) {
  return {
    me(): Promise<User> {
      return http.request("/users/me", { schema: userEnvelope }).then((r) => r.user);
    },

    updateProfile(input: UpdateProfileInput): Promise<User> {
      return http
        .request("/users/me", { method: "PATCH", body: input, schema: userEnvelope })
        .then((r) => r.user);
    },

    changePassword(input: ChangePasswordInput): Promise<void> {
      return http.request("/users/me/password", { method: "POST", body: input });
    },
  };
}
