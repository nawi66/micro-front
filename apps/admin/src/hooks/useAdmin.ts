import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@pulse/auth";
import type { UpdateSettingsInput } from "@pulse/api-client";

const keys = {
  overview: (workspaceId: string) => ["admin", "overview", workspaceId] as const,
};

// The shell's workspace list — invalidated when settings change or a workspace
// is deleted so the switcher stays in sync (shared QueryClient singleton).
const WORKSPACES_KEY = ["workspaces"] as const;

export function useOverview(workspaceId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: keys.overview(workspaceId),
    queryFn: () => client.admin.overview(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useUpdateSettings(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => client.admin.updateSettings(workspaceId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.overview(workspaceId) });
      void qc.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
  });
}

export function useDeleteWorkspace(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.remove(workspaceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: WORKSPACES_KEY }),
  });
}
