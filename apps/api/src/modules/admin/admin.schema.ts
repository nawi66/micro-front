import { z } from "zod";
import { objectIdString } from "../../lib/object-id.js";

export const adminParamsSchema = z
  .object({
    workspaceId: objectIdString,
  })
  .strict();

export const updateSettingsSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
