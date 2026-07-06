import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  role: z.enum(["owner", "admin", "member", "viewer"]).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  role: z.enum(["owner", "admin", "member", "viewer"]),
  createdAt: z.string(),
});

export const taskSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  assigneeId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const docSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  content: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const teamMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  role: z.enum(["owner", "admin", "member", "viewer"]),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

export const workspaceOverviewSchema = z.object({
  workspace: workspaceSchema,
  counts: z.object({
    members: z.number(),
    tasks: z.number(),
    docs: z.number(),
  }),
});

export const authTokenSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  user: userSchema,
});

/* Response envelopes returned by the API. */
export const userEnvelope = z.object({ user: userSchema });
export const workspaceEnvelope = z.object({ workspace: workspaceSchema });
export const workspacesEnvelope = z.object({ workspaces: z.array(workspaceSchema) });
export const memberEnvelope = z.object({ member: memberSchema });
export const membersEnvelope = z.object({ members: z.array(memberSchema) });
export const taskEnvelope = z.object({ task: taskSchema });
export const tasksEnvelope = z.object({ tasks: z.array(taskSchema) });
export const docEnvelope = z.object({ doc: docSchema });
export const docsEnvelope = z.object({ docs: z.array(docSchema) });
export const teamMembersEnvelope = z.object({ members: z.array(teamMemberSchema) });