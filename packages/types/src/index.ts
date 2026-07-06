/**
 * @pulse/types — pure domain types shared by all frontend apps and apps/api.
 * Zero runtime code. When a new shared entity appears, its shape goes here.
 */

/** Membership role within a workspace, ordered from most to least privileged. */
export type Role = "owner" | "admin" | "member" | "viewer";

/** A person with an account. Never carries secrets — this is the DTO shape. */
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A tenant boundary. Every business resource belongs to exactly one workspace. */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  /** The requesting user's role in this workspace, when returned in a membership context. */
  role?: Role;
  createdAt: string;
  updatedAt: string;
}

/** A membership tuple: which user has which role in which workspace. */
export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  createdAt: string;
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

/** A unit of work, always scoped to a workspace. */
export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Envelope the API returns on POST /auth/login and /auth/refresh. */
export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}
