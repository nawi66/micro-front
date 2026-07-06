import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@pulse/auth";
import type { CreateDocInput, UpdateDocInput } from "@pulse/api-client";
import type { Doc } from "@pulse/types";

const keys = {
  all: (workspaceId: string) => ["docs", workspaceId] as const,
};

export function useDocs(workspaceId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: keys.all(workspaceId),
    queryFn: () => client.docs.list(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateDoc(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocInput) => client.docs.create(workspaceId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(workspaceId) }),
  });
}

export function useUpdateDoc(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDocInput }) =>
      client.docs.update(workspaceId, id, input),
    onSuccess: (updated: Doc) => {
      qc.setQueryData<Doc[]>(keys.all(workspaceId), (prev) =>
        prev?.map((d) => (d.id === updated.id ? updated : d)),
      );
    },
  });
}

export function useDeleteDoc(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.docs.remove(workspaceId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(workspaceId) }),
  });
}
