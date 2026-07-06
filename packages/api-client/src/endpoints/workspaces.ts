import type { Role, Workspace, WorkspaceMember } from "@pulse/types";
import type { HttpClient } from "../client.js";
import {
  memberEnvelope,
  membersEnvelope,
  workspaceEnvelope,
  workspacesEnvelope,
} from "../schemas.js";

export function workspaceEndpoints(http: HttpClient) {
  return {
    list(): Promise<Workspace[]> {
      return http.request("/workspaces", { schema: workspacesEnvelope }).then((r) => r.workspaces);
    },

    create(name: string): Promise<Workspace> {
      return http
        .request("/workspaces", { method: "POST", body: { name }, schema: workspaceEnvelope })
        .then((r) => r.workspace);
    },

    get(workspaceId: string): Promise<Workspace> {
      return http
        .request(`/workspaces/${workspaceId}`, { schema: workspaceEnvelope })
        .then((r) => r.workspace);
    },

    listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
      return http
        .request(`/workspaces/${workspaceId}/members`, { schema: membersEnvelope })
        .then((r) => r.members);
    },

    addMember(
      workspaceId: string,
      input: { email: string; role: Exclude<Role, "owner"> },
    ): Promise<WorkspaceMember> {
      return http
        .request(`/workspaces/${workspaceId}/members`, {
          method: "POST",
          body: input,
          schema: memberEnvelope,
        })
        .then((r) => r.member);
    },
  };
}