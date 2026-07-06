import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@pulse/auth";
import type { InviteMemberInput } from "@pulse/api-client";
import type { Role } from "@pulse/types";

const keys = {
  all: (workspaceId: string) => ["team", workspaceId] as const,
};

type AssignableRole = Exclude<Role, "owner">;

export function useTeam(workspaceId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: keys.all(workspaceId),
    queryFn: () => client.team.list(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useInviteMember(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => client.team.invite(workspaceId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(workspaceId) }),
  });
}

export function useChangeRole(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: AssignableRole }) =>
      client.team.changeRole(workspaceId, memberId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(workspaceId) }),
  });
}

export function useRemoveMember(workspaceId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => client.team.remove(workspaceId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(workspaceId) }),
  });
}
