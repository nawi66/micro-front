import type { Doc } from "@pulse/types";
import type { HttpClient } from "../client.js";
import { docEnvelope, docsEnvelope } from "../schemas.js";

export interface CreateDocInput {
  title: string;
  content?: string;
}

export type UpdateDocInput = Partial<CreateDocInput>;

export interface ListDocsParams {
  q?: string;
  limit?: number;
}

export function docEndpoints(http: HttpClient) {
  const base = (workspaceId: string) => `/workspaces/${workspaceId}/docs`;

  return {
    list(workspaceId: string, params: ListDocsParams = {}): Promise<Doc[]> {
      return http
        .request(base(workspaceId), { query: { ...params }, schema: docsEnvelope })
        .then((r) => r.docs);
    },

    create(workspaceId: string, input: CreateDocInput): Promise<Doc> {
      return http
        .request(base(workspaceId), { method: "POST", body: input, schema: docEnvelope })
        .then((r) => r.doc);
    },

    get(workspaceId: string, docId: string): Promise<Doc> {
      return http
        .request(`${base(workspaceId)}/${docId}`, { schema: docEnvelope })
        .then((r) => r.doc);
    },

    update(workspaceId: string, docId: string, input: UpdateDocInput): Promise<Doc> {
      return http
        .request(`${base(workspaceId)}/${docId}`, {
          method: "PATCH",
          body: input,
          schema: docEnvelope,
        })
        .then((r) => r.doc);
    },

    remove(workspaceId: string, docId: string): Promise<void> {
      return http.request(`${base(workspaceId)}/${docId}`, { method: "DELETE" });
    },
  };
}
