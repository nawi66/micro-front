import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import type { Task, TaskPriority, TaskStatus } from "@pulse/types";

export interface TaskAttrs {
  workspaceId: Schema.Types.ObjectId;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: Schema.Types.ObjectId | null;
  createdBy: Schema.Types.ObjectId;
}

export interface TaskMethods {
  toDTO(): Task;
}

export type TaskDocument = HydratedDocument<TaskAttrs, TaskMethods>;
type TaskModelType = Model<TaskAttrs, Record<string, never>, TaskMethods>;

const taskSchema = new Schema<TaskAttrs, TaskModelType, TaskMethods>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      required: true,
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
      default: "medium",
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, strict: "throw" },
);

// Tenant-leading compound index; supports listing a workspace's tasks by recency.
taskSchema.index({ workspaceId: 1, status: 1, createdAt: -1 });
// Declared text index for search — never regex on user input (§9.8).
taskSchema.index({ title: "text", description: "text" });

taskSchema.method("toDTO", function toDTO(this: TaskDocument): Task {
  return {
    id: this.id,
    workspaceId: this.workspaceId.toString(),
    title: this.title,
    description: this.description ?? null,
    status: this.status,
    priority: this.priority,
    assigneeId: this.assigneeId ? this.assigneeId.toString() : null,
    createdBy: this.createdBy.toString(),
    createdAt: this.get("createdAt").toISOString(),
    updatedAt: this.get("updatedAt").toISOString(),
  };
});

export const TaskModel = model<TaskAttrs, TaskModelType>("Task", taskSchema);
