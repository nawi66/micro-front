import { z } from "zod";
import { objectIdString } from "../../lib/object-id.js";

const assignableRole = z.enum(["admin", "member", "viewer"]);

export const teamParamsSchema = z
  .object({
    workspaceId: objectIdString,
  })
  .strict();

export const memberParamsSchema = z
  .object({
    workspaceId: objectIdString,
    memberId: objectIdString,
  })
  .strict();

export const inviteMemberSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    role: assignableRole,
  })
  .strict();

export const changeRoleSchema = z
  .object({
    role: assignableRole,
  })
  .strict();

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
