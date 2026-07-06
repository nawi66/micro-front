import type { Workspace, WorkspaceOverview } from "@pulse/types";
import type { HttpClient } from "../client.js";
import { workspaceEnvelope, workspaceOverviewSchema } from "../schemas.js";

export interface UpdateSettingsInput {
  name?: string;
}

export function adminEndpoints(http: HttpClient) {
  const base = (workspaceId: string) => `/workspaces/${workspaceId}/admin`;

  return {
    overview(workspaceId: string): Promise<WorkspaceOverview> {
      return http.request(`${base(workspaceId)}/overview`, {
        schema: workspaceOverviewSchema,
      });
    },

    updateSettings(workspaceId: string, input: UpdateSettingsInput): Promise<Workspace> {
      return http
        .request(`${base(workspaceId)}/settings`, {
          method: "PATCH",
          body: input,
          schema: workspaceEnvelope,
        })
        .then((r) => r.workspace);
    },

    remove(workspaceId: string): Promise<void> {
      return http.request(base(workspaceId), { method: "DELETE" });
    },
  };
}
