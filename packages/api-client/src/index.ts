import { createHttpClient, type CreateClientOptions, type HttpClient } from "./client.js";
import { authEndpoints } from "./endpoints/auth.js";
import { workspaceEndpoints } from "./endpoints/workspaces.js";
import { taskEndpoints } from "./endpoints/tasks.js";

export type ApiClient = {
  http: HttpClient;
  auth: ReturnType<typeof authEndpoints>;
  workspaces: ReturnType<typeof workspaceEndpoints>;
  tasks: ReturnType<typeof taskEndpoints>;
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
    workspaces: workspaceEndpoints(http),
    tasks: taskEndpoints(http),
  };
}

export { ApiError } from "./errors.js";
export type { CreateClientOptions, HttpClient, RequestOptions } from "./client.js";
export type { CreateTaskInput, UpdateTaskInput, ListTasksParams } from "./endpoints/tasks.js";
export * as schemas from "./schemas.js";