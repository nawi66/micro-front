import type { Role, TeamMember, WorkspaceMember } from "@pulse/types";
import { authService } from "../auth/auth.service.js";
import { workspacesService } from "../workspaces/workspaces.service.js";
import type { InviteMemberInput } from "./team.schema.js";

/**
 * Team service — the workspace-facing "roster" view. Membership mutations are
 * delegated to workspacesService (owner of the WorkspaceMember model, §no
 * cross-module models); this module composes membership + user profiles and
 * enforces the RBAC surface for team management.
 */
export const teamService = {
  /** List members enriched with each user's name and email. */
  async list(workspaceId: string): Promise<TeamMember[]> {
    const members = await workspacesService.listMembers(workspaceId);
    if (members.length === 0) return [];

    const users = await authService.findUsersByIds(members.map((m) => m.userId));
    const userById = new Map(users.map((u) => [u.id, u]));

    return members
      .map((m) => {
        const user = userById.get(m.userId);
        return {
          id: m.id,
          userId: m.userId,
          workspaceId: m.workspaceId,
          role: m.role,
          name: user?.name ?? "Unknown user",
          email: user?.email ?? "",
          createdAt: m.createdAt,
        } satisfies TeamMember;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async invite(workspaceId: string, input: InviteMemberInput): Promise<WorkspaceMember> {
    return workspacesService.addMember(workspaceId, input.email, input.role);
  },

  async changeRole(
    workspaceId: string,
    memberId: string,
    role: Exclude<Role, "owner">,
  ): Promise<WorkspaceMember> {
    return workspacesService.changeRole(workspaceId, memberId, role);
  },

  async remove(workspaceId: string, memberId: string): Promise<void> {
    return workspacesService.removeMember(workspaceId, memberId);
  },
};
