import mongoose, { type FilterQuery } from "mongoose";
import type { Doc } from "@pulse/types";
import { NotFoundError } from "../../lib/errors.js";
import { DocModel, type DocAttrs } from "./docs.model.js";
import type { CreateDocInput, ListDocsQuery, UpdateDocInput } from "./docs.schema.js";

const oid = (id: string) => new mongoose.Types.ObjectId(id);

/**
 * Docs service. Every method filters by workspaceId inside the query itself —
 * a cross-tenant read/write is impossible to express here (§9.2).
 */
export const docsService = {
  async list(workspaceId: string, query: ListDocsQuery): Promise<Doc[]> {
    const filter: FilterQuery<DocAttrs> = { workspaceId: oid(workspaceId) };
    if (query.q) filter.$text = { $search: query.q };

    const docs = await DocModel.find(filter)
      .sort({ updatedAt: -1 })
      .limit(query.limit);
    return docs.map((d) => d.toDTO());
  },

  async create(workspaceId: string, authorId: string, input: CreateDocInput): Promise<Doc> {
    const author = oid(authorId);
    const doc = await DocModel.create({
      workspaceId: oid(workspaceId),
      title: input.title,
      content: input.content,
      createdBy: author,
      updatedBy: author,
    });
    return doc.toDTO();
  },

  async get(workspaceId: string, docId: string): Promise<Doc> {
    const doc = await DocModel.findOne({ _id: oid(docId), workspaceId: oid(workspaceId) });
    if (!doc) throw new NotFoundError("Document not found");
    return doc.toDTO();
  },

  async update(
    workspaceId: string,
    docId: string,
    editorId: string,
    input: UpdateDocInput,
  ): Promise<Doc> {
    const update: Record<string, unknown> = { updatedBy: oid(editorId) };
    if (input.title !== undefined) update.title = input.title;
    if (input.content !== undefined) update.content = input.content;

    const doc = await DocModel.findOneAndUpdate(
      { _id: oid(docId), workspaceId: oid(workspaceId) },
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!doc) throw new NotFoundError("Document not found");
    return doc.toDTO();
  },

  async remove(workspaceId: string, docId: string): Promise<void> {
    const res = await DocModel.deleteOne({ _id: oid(docId), workspaceId: oid(workspaceId) });
    if (res.deletedCount === 0) throw new NotFoundError("Document not found");
  },

  /** Count of docs in a workspace — for the admin overview. */
  async countForWorkspace(workspaceId: string): Promise<number> {
    return DocModel.countDocuments({ workspaceId: oid(workspaceId) });
  },

  /** Purge every doc in a workspace — called when a workspace is deleted. */
  async deleteAllForWorkspace(
    workspaceId: string,
    session?: mongoose.ClientSession,
  ): Promise<void> {
    await DocModel.deleteMany(
      { workspaceId: oid(workspaceId) },
      session ? { session } : {},
    );
  },
};
