import { z } from "zod";
import { objectIdString } from "../../lib/object-id.js";

const status = z.enum(["todo", "in_progress", "done"]);
const priority = z.enum(["low", "medium", "high"]);

export const taskParamsSchema = z
  .object({
    workspaceId: objectIdString,
    taskId: objectIdString,
  })
  .strict();

export const listTasksQuerySchema = z
  .object({
    status: status.optional(),
    q: z.string().trim().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).nullish(),
    status: status.default("todo"),
    priority: priority.default("medium"),
    assigneeId: objectIdString.nullish(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullish(),
    status: status.optional(),
    priority: priority.optional(),
    assigneeId: objectIdString.nullish(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
