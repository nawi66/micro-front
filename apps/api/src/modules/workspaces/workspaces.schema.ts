import { z } from "zod";
import { objectIdString } from "../../lib/object-id.js";

export const createWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
  })
  .strict();

export const workspaceParamsSchema = z
  .object({
    workspaceId: objectIdString,
  })
  .strict();

export const addMemberSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    role: z.enum(["admin", "member", "viewer"]),
  })
  .strict();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
