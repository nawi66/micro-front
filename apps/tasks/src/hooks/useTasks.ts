import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@pulse/auth";
import type { CreateTaskInput, UpdateTaskInput } from "@pulse/api-client";
import type { Task } from "@pulse/types";

const keys = {
  all: (workspaceId: string) => ["tasks", workspaceId] as const,
};

export function useTasks(workspaceId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: keys.all(workspaceId),
    queryFn: () => client.tasks.list(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateTask(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => client.tasks.create(workspaceId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(workspaceId) }),
  });
}

export function useUpdateTask(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      client.tasks.update(workspaceId, id, input),
    onSuccess: (updated: Task) => {
      qc.setQueryData<Task[]>(keys.all(workspaceId), (prev) =>
        prev?.map((t) => (t.id === updated.id ? updated : t)),
      );
    },
  });
}

export function useDeleteTask(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.tasks.remove(workspaceId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(workspaceId) }),
  });
}