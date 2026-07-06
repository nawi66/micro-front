import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import type { Role, Workspace, WorkspaceMember } from "@pulse/types";

/* ---------------------------------- Workspace --------------------------------- */

export interface WorkspaceAttrs {
  name: string;
  slug: string;
  createdBy: Schema.Types.ObjectId;
}

export interface WorkspaceMethods {
  toDTO(role?: Role): Workspace;
}

export type WorkspaceDocument = HydratedDocument<WorkspaceAttrs, WorkspaceMethods>;
type WorkspaceModelType = Model<WorkspaceAttrs, Record<string, never>, WorkspaceMethods>;

const workspaceSchema = new Schema<WorkspaceAttrs, WorkspaceModelType, WorkspaceMethods>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, strict: "throw" },
);

// slug uniqueness is declared via `unique: true` on the field above.

workspaceSchema.method("toDTO", function toDTO(this: WorkspaceDocument, role?: Role): Workspace {
  return {
    id: this.id,
    name: this.name,
    slug: this.slug,
    ...(role ? { role } : {}),
    createdAt: this.get("createdAt").toISOString(),
    updatedAt: this.get("updatedAt").toISOString(),
  };
});

export const WorkspaceModel = model<WorkspaceAttrs, WorkspaceModelType>("Workspace", workspaceSchema);

/* ------------------------------ WorkspaceMember ------------------------------- */

export interface WorkspaceMemberAttrs {
  userId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  role: Role;
}

export interface WorkspaceMemberMethods {
  toDTO(): WorkspaceMember;
}

export type WorkspaceMemberDocument = HydratedDocument<
  WorkspaceMemberAttrs,
  WorkspaceMemberMethods
>;
type WorkspaceMemberModelType = Model<
  WorkspaceMemberAttrs,
  Record<string, never>,
  WorkspaceMemberMethods
>;

const workspaceMemberSchema = new Schema<
  WorkspaceMemberAttrs,
  WorkspaceMemberModelType,
  WorkspaceMemberMethods
>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      required: true,
    },
  },
  { timestamps: true, strict: "throw" },
);

// One membership per (user, workspace); compound index leads with workspaceId.
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
workspaceMemberSchema.index({ userId: 1 });

workspaceMemberSchema.method("toDTO", function toDTO(
  this: WorkspaceMemberDocument,
): WorkspaceMember {
  return {
    id: this.id,
    userId: this.userId.toString(),
    workspaceId: this.workspaceId.toString(),
    role: this.role,
    createdAt: this.get("createdAt").toISOString(),
  };
});

export const WorkspaceMemberModel = model<WorkspaceMemberAttrs, WorkspaceMemberModelType>(
  "WorkspaceMember",
  workspaceMemberSchema,
  "workspace_members",
);
