import type { Role, TeamMember, WorkspaceMember } from "@pulse/types";
import type { HttpClient } from "../client.js";
import { memberEnvelope, teamMembersEnvelope } from "../schemas.js";

type AssignableRole = Exclude<Role, "owner">;

export interface InviteMemberInput {
  email: string;
  role: AssignableRole;
}

export function teamEndpoints(http: HttpClient) {
  const base = (workspaceId: string) => `/workspaces/${workspaceId}/team`;

  return {
    list(workspaceId: string): Promise<TeamMember[]> {
      return http
        .request(base(workspaceId), { schema: teamMembersEnvelope })
        .then((r) => r.members);
    },

    invite(workspaceId: string, input: InviteMemberInput): Promise<WorkspaceMember> {
      return http
        .request(base(workspaceId), { method: "POST", body: input, schema: memberEnvelope })
        .then((r) => r.member);
    },

    changeRole(
      workspaceId: string,
      memberId: string,
      role: AssignableRole,
    ): Promise<WorkspaceMember> {
      return http
        .request(`${base(workspaceId)}/${memberId}`, {
          method: "PATCH",
          body: { role },
          schema: memberEnvelope,
        })
        .then((r) => r.member);
    },

    remove(workspaceId: string, memberId: string): Promise<void> {
      return http.request(`${base(workspaceId)}/${memberId}`, { method: "DELETE" });
    },
  };
}
