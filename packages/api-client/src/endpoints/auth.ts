import type { AuthTokenResponse, User } from "@pulse/types";
import type { HttpClient } from "../client.js";
import { authTokenSchema, userEnvelope } from "../schemas.js";

export function authEndpoints(http: HttpClient) {
  return {
    register(input: { email: string; password: string; name: string }): Promise<User> {
      return http
        .request("/auth/register", { method: "POST", body: input, schema: userEnvelope })
        .then((r) => r.user);
    },

    login(input: { email: string; password: string }): Promise<AuthTokenResponse> {
      return http.request("/auth/login", {
        method: "POST",
        body: input,
        schema: authTokenSchema,
      });
    },

    me(): Promise<User> {
      return http.request("/auth/me", { schema: userEnvelope }).then((r) => r.user);
    },

    logout(): Promise<void> {
      return http.request("/auth/logout", { method: "POST" });
    },
  };
}