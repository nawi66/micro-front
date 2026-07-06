import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@pulse/auth";
import type { Workspace } from "@pulse/types";
import { useWorkspaceStore } from "../stores/workspace.js";

const KEY = ["workspaces"] as const;

/** Load the user's workspaces and keep an active one selected. */
export function useWorkspaces() {
  const client = useApiClient();
  const { activeId, setActive } = useWorkspaceStore();

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => client.workspaces.list(),
  });

  // Auto-select the first workspace once loaded, or when the active one vanishes.
  useEffect(() => {
    const list = query.data;
    if (!list || list.length === 0) return;
    const stillValid = activeId && list.some((w) => w.id === activeId);
    if (!stillValid) setActive(list[0]!.id);
  }, [query.data, activeId, setActive]);

  const active: Workspace | undefined =
    query.data?.find((w) => w.id === activeId) ?? query.data?.[0];

  return { ...query, workspaces: query.data ?? [], active };
}

/** Create a workspace and refresh the list. */
export function useCreateWorkspace() {
  const client = useApiClient();
  const qc = useQueryClient();
  const setActive = useWorkspaceStore((s) => s.setActive);

  return useMutation({
    mutationFn: (name: string) => client.workspaces.create(name),
    onSuccess: (ws) => {
      setActive(ws.id);
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}