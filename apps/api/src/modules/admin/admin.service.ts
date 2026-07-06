import mongoose from "mongoose";
import type { Role, Workspace, WorkspaceOverview } from "@pulse/types";
import { NotFoundError } from "../../lib/errors.js";
import { docsService } from "../docs/docs.service.js";
import { tasksService } from "../tasks/tasks.service.js";
import { workspacesService } from "../workspaces/workspaces.service.js";
import type { UpdateSettingsInput } from "./admin.schema.js";

/**
 * Admin service — workspace-level administration. The Workspace entity and its
 * members are owned by workspacesService; tasks/docs by their modules. This
 * module orchestrates across them via their services (§no cross-module models).
 */
export const adminService = {
  /** Workspace plus resource counts, for the admin dashboard. */
  async overview(workspaceId: string, role: Role): Promise<WorkspaceOverview> {
    const [workspace, members, tasks, docs] = await Promise.all([
      workspacesService.getForUser(workspaceId, role),
      workspacesService.countMembers(workspaceId),
      tasksService.countForWorkspace(workspaceId),
      docsService.countForWorkspace(workspaceId),
    ]);
    return { workspace, counts: { members, tasks, docs } };
  },

  async updateSettings(
    workspaceId: string,
    input: UpdateSettingsInput,
    role: Role,
  ): Promise<Workspace> {
    return workspacesService.updateSettings(workspaceId, input, role);
  },

  /**
   * Danger zone: delete a workspace and every resource scoped to it. All
   * deletions run in one transaction — a partial purge would orphan data.
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    const session = await mongoose.startSession();
    try {
      let deleted = false;
      await session.withTransaction(async () => {
        await tasksService.deleteAllForWorkspace(workspaceId, session);
        await docsService.deleteAllForWorkspace(workspaceId, session);
        await workspacesService.deleteWorkspace(workspaceId, session);
        deleted = true;
      });
      if (!deleted) throw new NotFoundError("Workspace not found");
    } finally {
      await session.endSession();
    }
  },
};
