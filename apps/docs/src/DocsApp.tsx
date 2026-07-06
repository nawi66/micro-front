import { useEffect, useState } from "react";
import type { Doc } from "@pulse/types";
import { Button, Input, Spinner, cn } from "@pulse/ui";
import { useCreateDoc, useDeleteDoc, useDocs, useUpdateDoc } from "./hooks/useDocs.js";

/**
 * Docs MFE root. A two-pane document editor: the workspace's docs on the left,
 * a title + content editor on the right. Assumes AuthProvider + QueryClient are
 * in the tree (shell in production, standalone dev entry otherwise).
 */
export default function DocsApp({ workspaceId }: { workspaceId: string }) {
  const docsQuery = useDocs(workspaceId);
  const createDoc = useCreateDoc(workspaceId);
  const updateDoc = useUpdateDoc(workspaceId);
  const deleteDoc = useDeleteDoc(workspaceId);

  const docs = docsQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = docs.find((d) => d.id === selectedId) ?? null;

  // Keep a selection as docs load / change.
  useEffect(() => {
    if (!selectedId && docs.length > 0) setSelectedId(docs[0]!.id);
    if (selectedId && !docs.some((d) => d.id === selectedId)) {
      setSelectedId(docs[0]?.id ?? null);
    }
  }, [docs, selectedId]);

  const onCreate = async () => {
    // The API requires non-empty content on create, so seed a blank line
    // (invisible in the editor) rather than an empty string.
    const doc = await createDoc.mutateAsync({ title: "Untitled", content: "\n" });
    setSelectedId(doc.id);
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl gap-4 p-6">
      <aside className="flex w-64 shrink-0 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
            Documents
          </h1>
          <Button size="sm" onClick={() => void onCreate()} disabled={createDoc.isPending}>
            {createDoc.isPending ? "…" : "New"}
          </Button>
        </div>

        {docsQuery.isLoading ? (
          <div className="flex justify-center py-8 text-fg-muted">
            <Spinner />
          </div>
        ) : docsQuery.isError ? (
          <p className="py-8 text-center text-sm text-danger">Could not load documents.</p>
        ) : docs.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">No documents yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {docs.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className={cn(
                    "w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors",
                    doc.id === selectedId
                      ? "bg-primary/15 text-primary"
                      : "text-fg-muted hover:bg-surface hover:text-fg",
                  )}
                >
                  {doc.title || "Untitled"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="min-w-0 flex-1">
        {selected ? (
          <DocEditor
            key={selected.id}
            doc={selected}
            saving={updateDoc.isPending}
            onSave={(input) => updateDoc.mutate({ id: selected.id, input })}
            onDelete={() => deleteDoc.mutate(selected.id)}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-fg-muted">
            Select or create a document to start editing.
          </div>
        )}
      </section>
    </div>
  );
}

interface DocEditorProps {
  doc: Doc;
  saving: boolean;
  onSave: (input: { title: string; content: string }) => void;
  onDelete: () => void;
}

function DocEditor({ doc, saving, onSave, onDelete }: DocEditorProps) {
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const dirty = title !== doc.title || content !== doc.content;

  return (
    <div className="flex h-full flex-col gap-4 rounded-card border border-glass-border bg-glass p-5 shadow-xl shadow-black/5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Input
          aria-label="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-base font-medium"
        />
        <Button
          onClick={() => onSave({ title: title.trim() || "Untitled", content })}
          disabled={!dirty || saving}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete document">
          ✕
        </Button>
      </div>
      <textarea
        aria-label="Document content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing…"
        className="min-h-0 flex-1 resize-none rounded-md border border-glass-border bg-glass-raised p-4 text-sm leading-relaxed text-fg backdrop-blur-md focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      <p className="text-xs text-fg-subtle">
        Last updated {new Date(doc.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
