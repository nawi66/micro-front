import { useForm } from "react-hook-form";
import type { Role } from "@pulse/types";
import { Badge, Button, Field, Input, Spinner } from "@pulse/ui";
import {
  useChangeRole,
  useInviteMember,
  useRemoveMember,
  useTeam,
} from "./hooks/useTeam.js";

type AssignableRole = Exclude<Role, "owner">;

interface InviteForm {
  email: string;
  role: AssignableRole;
}

const ROLE_TONE = {
  owner: "primary",
  admin: "primary",
  member: "neutral",
  viewer: "neutral",
} as const;

const selectClass =
  "h-9 rounded-md border border-glass-border bg-glass-raised px-2.5 text-sm text-fg backdrop-blur-md focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50";

/**
 * Team MFE root. Shows the workspace roster and — for owners/admins — invite,
 * role-change, and remove controls. The API enforces RBAC; failed writes here
 * simply surface as no-ops with a re-fetch.
 */
export default function TeamApp({ workspaceId }: { workspaceId: string }) {
  const teamQuery = useTeam(workspaceId);
  const invite = useInviteMember(workspaceId);
  const changeRole = useChangeRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);

  const { register, handleSubmit, reset, formState } = useForm<InviteForm>({
    defaultValues: { email: "", role: "member" },
  });

  const onInvite = handleSubmit(async (values) => {
    await invite.mutateAsync({ email: values.email.trim(), role: values.role });
    reset();
  });

  const members = teamQuery.data ?? [];
  const busy = changeRole.isPending || removeMember.isPending;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-fg">Team</h1>
        <p className="text-sm text-fg-muted">Manage who has access to this workspace.</p>
      </header>

      <form
        onSubmit={onInvite}
        className="flex items-end gap-3 rounded-card border border-glass-border bg-glass p-4 shadow-xl shadow-black/5 backdrop-blur-xl"
      >
        <Field label="Invite by email" htmlFor="email" className="flex-1">
          <Input
            id="email"
            type="email"
            placeholder="teammate@company.com"
            {...register("email", { required: true })}
          />
        </Field>
        <Field label="Role" htmlFor="role">
          <select id="role" className={selectClass} {...register("role")}>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </Field>
        <Button type="submit" disabled={invite.isPending || !formState.isValid}>
          {invite.isPending ? "Inviting…" : "Invite"}
        </Button>
      </form>

      {invite.isError && (
        <p className="text-sm text-danger">
          Could not invite that person — check the email is a registered user.
        </p>
      )}

      {teamQuery.isLoading ? (
        <div className="flex justify-center py-12 text-fg-muted">
          <Spinner />
        </div>
      ) : teamQuery.isError ? (
        <p className="py-12 text-center text-sm text-danger">Could not load the team.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-md border border-glass-border bg-glass p-3 shadow-lg shadow-black/5 backdrop-blur-md"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{m.name}</p>
                <p className="truncate text-xs text-fg-muted">{m.email}</p>
              </div>

              {m.role === "owner" ? (
                <Badge tone={ROLE_TONE.owner}>owner</Badge>
              ) : (
                <>
                  <select
                    aria-label={`Role for ${m.name}`}
                    className={selectClass}
                    value={m.role}
                    disabled={busy}
                    onChange={(e) =>
                      changeRole.mutate({
                        memberId: m.id,
                        role: e.target.value as AssignableRole,
                      })
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => removeMember.mutate(m.id)}
                    aria-label={`Remove ${m.name}`}
                  >
                    ✕
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
