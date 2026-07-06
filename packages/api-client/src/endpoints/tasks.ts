import type { Task, TaskPriority, TaskStatus } from "@pulse/types";
import type { HttpClient } from "../client.js";
import { taskEnvelope, tasksEnvelope } from "../schemas.js";

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface ListTasksParams {
  status?: TaskStatus;
  q?: string;
  limit?: number;
}

export function taskEndpoints(http: HttpClient) {
  const base = (workspaceId: string) => `/workspaces/${workspaceId}/tasks`;

  return {
    list(workspaceId: string, params: ListTasksParams = {}): Promise<Task[]> {
      return http
        .request(base(workspaceId), { query: { ...params }, schema: tasksEnvelope })
        .then((r) => r.tasks);
    },

    create(workspaceId: string, input: CreateTaskInput): Promise<Task> {
      return http
        .request(base(workspaceId), { method: "POST", body: input, schema: taskEnvelope })
        .then((r) => r.task);
    },

    get(workspaceId: string, taskId: string): Promise<Task> {
      return http
        .request(`${base(workspaceId)}/${taskId}`, { schema: taskEnvelope })
        .then((r) => r.task);
    },

    update(workspaceId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
      return http
        .request(`${base(workspaceId)}/${taskId}`, {
          method: "PATCH",
          body: input,
          schema: taskEnvelope,
        })
        .then((r) => r.task);
    },

    remove(workspaceId: string, taskId: string): Promise<void> {
      return http.request(`${base(workspaceId)}/${taskId}`, { method: "DELETE" });
    },
  };
}