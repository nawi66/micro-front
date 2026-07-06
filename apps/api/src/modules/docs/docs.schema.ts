import { z } from "zod";
import { objectIdString } from "../../lib/object-id.js";

// Content is capped so a write stays within the default 100kb JSON body limit.
const MAX_CONTENT = 50_000;

export const docParamsSchema = z
  .object({
    workspaceId: objectIdString,
    docId: objectIdString,
  })
  .strict();

export const listDocsQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const createDocSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().max(MAX_CONTENT).default(""),
  })
  .strict();

export const updateDocSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().max(MAX_CONTENT).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type CreateDocInput = z.infer<typeof createDocSchema>;
export type UpdateDocInput = z.infer<typeof updateDocSchema>;
export type ListDocsQuery = z.infer<typeof listDocsQuerySchema>;
