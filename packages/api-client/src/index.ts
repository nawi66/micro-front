import { createHttpClient, type CreateClientOptions, type HttpClient } from "./client.js";
import { authEndpoints } from "./endpoints/auth.js";
import { userEndpoints } from "./endpoints/users.js";
import { workspaceEndpoints } from "./endpoints/workspaces.js";
import { taskEndpoints } from "./endpoints/tasks.js";
import { docEndpoints } from "./endpoints/docs.js";
import { teamEndpoints } from "./endpoints/team.js";
import { adminEndpoints } from "./endpoints/admin.js";

export type ApiClient = {
  http: HttpClient;
  auth: ReturnType<typeof authEndpoints>;
  users: ReturnType<typeof userEndpoints>;
  workspaces: ReturnType<typeof workspaceEndpoints>;
  tasks: ReturnType<typeof taskEndpoints>;
  docs: ReturnType<typeof docEndpoints>;
  team: ReturnType<typeof teamEndpoints>;
  admin: ReturnType<typeof adminEndpoints>;
};

/**
 * Single factory the whole frontend uses. @pulse/auth calls this once with a
 * getToken/refresh pair and shares the instance across MFEs.
 */
export function createClient(options: CreateClientOptions): ApiClient {
  const http = createHttpClient(options);
  return {
    http,
    auth: authEndpoints(http),
    users: userEndpoints(http),
    workspaces: workspaceEndpoints(http),
    tasks: taskEndpoints(http),
    docs: docEndpoints(http),
    team: teamEndpoints(http),
    admin: adminEndpoints(http),
  };
}

export { ApiError } from "./errors.js";
export type { CreateClientOptions, HttpClient, RequestOptions } from "./client.js";
export type { CreateTaskInput, UpdateTaskInput, ListTasksParams } from "./endpoints/tasks.js";
export type { CreateDocInput, UpdateDocInput, ListDocsParams } from "./endpoints/docs.js";
export type { InviteMemberInput } from "./endpoints/team.js";
export type { UpdateSettingsInput } from "./endpoints/admin.js";
export type { UpdateProfileInput, ChangePasswordInput } from "./endpoints/users.js";
export * as schemas from "./schemas.js";