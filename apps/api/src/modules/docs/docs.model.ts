import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import type { Doc } from "@pulse/types";

export interface DocAttrs {
  workspaceId: Schema.Types.ObjectId;
  title: string;
  content: string;
  createdBy: Schema.Types.ObjectId;
  updatedBy: Schema.Types.ObjectId;
}

export interface DocMethods {
  toDTO(): Doc;
}

export type DocDocument = HydratedDocument<DocAttrs, DocMethods>;
type DocModelType = Model<DocAttrs, Record<string, never>, DocMethods>;

const docSchema = new Schema<DocAttrs, DocModelType, DocMethods>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, strict: "throw" },
);

// Tenant-leading compound index; supports listing a workspace's docs by recency.
docSchema.index({ workspaceId: 1, updatedAt: -1 });
// Declared text index for search — never regex on user input (§9.8).
docSchema.index({ title: "text", content: "text" });

docSchema.method("toDTO", function toDTO(this: DocDocument): Doc {
  return {
    id: this.id,
    workspaceId: this.workspaceId.toString(),
    title: this.title,
    content: this.content,
    createdBy: this.createdBy.toString(),
    updatedBy: this.updatedBy.toString(),
    createdAt: this.get("createdAt").toISOString(),
    updatedAt: this.get("updatedAt").toISOString(),
  };
});

export const DocModel = model<DocAttrs, DocModelType>("Doc", docSchema);
