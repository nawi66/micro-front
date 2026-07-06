import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import type { Role, Workspace, WorkspaceMember } from "@pulse/types";
import { logger } from "../../config/logger.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { authService } from "../auth/auth.service.js";
import {
  WorkspaceMemberModel,
  WorkspaceModel,
  type WorkspaceDocument,
} from "./workspaces.model.js";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex");
  return `${base || "workspace"}-${suffix}`;
}

export const workspacesService = {
  /** Create a workspace and its owner membership atomically. */
  async create(userId: string, name: string): Promise<Workspace> {
    const ownerId = new mongoose.Types.ObjectId(userId);
    const session = await mongoose.startSession();
    try {
      let created!: WorkspaceDocument;
      await session.withTransaction(async () => {
        const docs = await WorkspaceModel.create(
          [{ name, slug: slugify(name), createdBy: ownerId }],
          { session },
        );
        created = docs[0]!;
        await WorkspaceMemberModel.create(
          [{ workspaceId: created._id, userId: ownerId, role: "owner" as Role }],
          { session },
        );
      });
      logger.info(
        { event: "workspace_created", workspaceId: created.id, userId },
        "workspace created",
      );
      return created.toDTO("owner");
    } finally {
      await session.endSession();
    }
  },

  /** Every workspace the user is a member of, tagged with their role. */
  async listForUser(userId: string): Promise<Workspace[]> {
    const memberships = await WorkspaceMemberModel.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();
    if (memberships.length === 0) return [];

    const roleByWs = new Map(memberships.map((m) => [m.workspaceId.toString(), m.role]));
    // `sanitizeFilter` (db.ts) wraps object-valued filters in `$eq`, which breaks
    // operator queries like `$in`. These ids are server-derived, so mark the
    // operator trusted to opt this one query out of sanitization.
    const workspaces = await WorkspaceModel.find({
      _id: mongoose.trusted({ $in: memberships.map((m) => m.workspaceId) }),
    });
    return workspaces
      .map((w) => w.toDTO(roleByWs.get(w.id)))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  /** A single workspace the user belongs to. `role` is provided by the tenant guard. */
  async getForUser(workspaceId: string, role: Role): Promise<Workspace> {
    const ws = await WorkspaceModel.findById(workspaceId);
    if (!ws) throw new NotFoundError("Workspace not found");
    return ws.toDTO(role);
  },

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const members = await WorkspaceMemberModel.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    });
    return members.map((m) => m.toDTO());
  },

  /** Add an existing user to a workspace. `owner` cannot be granted this way. */
  async addMember(
    workspaceId: string,
    email: string,
    role: Exclude<Role, "owner">,
  ): Promise<WorkspaceMember> {
    const user = await authService.findUserByEmail(email);
    if (!user) throw new NotFoundError("No user with that email");

    const existing = await WorkspaceMemberModel.findOne({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(user.id),
    });
    if (existing) throw new ConflictError("User is already a member");

    const member = await WorkspaceMemberModel.create({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(user.id),
      role,
    });
    logger.info(
      { event: "member_added", workspaceId, userId: user.id, role },
      "member added",
    );
    return member.toDTO();
  },

  /** Guard helper: ensure an actor isn't the sole owner before destructive ops. */
  async assertNotSoleOwner(workspaceId: string, userId: string): Promise<void> {
    const owners = await WorkspaceMemberModel.countDocuments({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      role: "owner",
    });
    const self = await WorkspaceMemberModel.findOne({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(userId),
      role: "owner",
    });
    if (self && owners <= 1) {
      throw new ForbiddenError("Cannot remove the sole owner");
    }
  },
};
