import mongoose, { type FilterQuery } from "mongoose";
import type { Task } from "@pulse/types";
import { NotFoundError } from "../../lib/errors.js";
import { TaskModel, type TaskAttrs } from "./tasks.model.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./tasks.schema.js";

const oid = (id: string) => new mongoose.Types.ObjectId(id);

/**
 * Tasks service. Every method filters by workspaceId inside the query itself —
 * a cross-tenant read/write is impossible to express here (§9.2).
 */
export const tasksService = {
  async list(workspaceId: string, query: ListTasksQuery): Promise<Task[]> {
    const filter: FilterQuery<TaskAttrs> = { workspaceId: oid(workspaceId) };
    if (query.status) filter.status = query.status;
    if (query.q) filter.$text = { $search: query.q };

    const tasks = await TaskModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit);
    return tasks.map((t) => t.toDTO());
  },

  async create(
    workspaceId: string,
    createdBy: string,
    input: CreateTaskInput,
  ): Promise<Task> {
    const task = await TaskModel.create({
      workspaceId: oid(workspaceId),
      createdBy: oid(createdBy),
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId ? oid(input.assigneeId) : null,
    });
    return task.toDTO();
  },

  async get(workspaceId: string, taskId: string): Promise<Task> {
    const task = await TaskModel.findOne({ _id: oid(taskId), workspaceId: oid(workspaceId) });
    if (!task) throw new NotFoundError("Task not found");
    return task.toDTO();
  },

  async update(
    workspaceId: string,
    taskId: string,
    input: UpdateTaskInput,
  ): Promise<Task> {
    const update: Record<string, unknown> = {};
    if (input.title !== undefined) update.title = input.title;
    if (input.description !== undefined) update.description = input.description ?? null;
    if (input.status !== undefined) update.status = input.status;
    if (input.priority !== undefined) update.priority = input.priority;
    if (input.assigneeId !== undefined) {
      update.assigneeId = input.assigneeId ? oid(input.assigneeId) : null;
    }

    const task = await TaskModel.findOneAndUpdate(
      { _id: oid(taskId), workspaceId: oid(workspaceId) },
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!task) throw new NotFoundError("Task not found");
    return task.toDTO();
  },

  async remove(workspaceId: string, taskId: string): Promise<void> {
    const res = await TaskModel.deleteOne({ _id: oid(taskId), workspaceId: oid(workspaceId) });
    if (res.deletedCount === 0) throw new NotFoundError("Task not found");
  },

  /** Count of tasks in a workspace — for the admin overview. */
  async countForWorkspace(workspaceId: string): Promise<number> {
    return TaskModel.countDocuments({ workspaceId: oid(workspaceId) });
  },

  /** Purge every task in a workspace — called when a workspace is deleted. */
  async deleteAllForWorkspace(
    workspaceId: string,
    session?: mongoose.ClientSession,
  ): Promise<void> {
    await TaskModel.deleteMany(
      { workspaceId: oid(workspaceId) },
      session ? { session } : {},
    );
  },
};
