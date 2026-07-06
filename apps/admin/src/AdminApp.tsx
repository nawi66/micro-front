import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Spinner,
} from "@pulse/ui";
import { useDeleteWorkspace, useOverview, useUpdateSettings } from "./hooks/useAdmin.js";

interface SettingsForm {
  name: string;
}

/**
 * Admin MFE root. Shows a workspace overview (resource counts), a settings form
 * to rename the workspace, and a danger zone to delete it. The API restricts
 * every action to owner/admin (delete is owner-only); this UI surfaces failures.
 */
export default function AdminApp({ workspaceId }: { workspaceId: string }) {
  const overviewQuery = useOverview(workspaceId);
  const updateSettings = useUpdateSettings(workspaceId);
  const deleteWorkspace = useDeleteWorkspace(workspaceId);
  const [confirmName, setConfirmName] = useState("");

  const overview = overviewQuery.data;
  const { register, handleSubmit, formState } = useForm<SettingsForm>({
    values: { name: overview?.workspace.name ?? "" },
  });

  const onSave = handleSubmit((values) => {
    updateSettings.mutate({ name: values.name.trim() });
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-fg-muted">
        <Spinner />
      </div>
    );
  }
  if (overviewQuery.isError || !overview) {
    return (
      <div className="grid h-full place-items-center p-8 text-sm text-danger">
        You don’t have access to this workspace’s admin, or it failed to load.
      </div>
    );
  }

  const canDelete = confirmName === overview.workspace.name;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-fg">Admin</h1>
        <p className="text-sm text-fg-muted">Settings and administration for this workspace.</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Members", overview.counts.members],
            ["Tasks", overview.counts.tasks],
            ["Documents", overview.counts.docs],
          ] as const
        ).map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold text-fg">{value}</p>
              <p className="text-xs uppercase tracking-wide text-fg-subtle">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace settings</CardTitle>
          <CardDescription>Rename how this workspace appears across PulseHQ.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="flex items-end gap-3">
            <Field label="Workspace name" htmlFor="name" className="flex-1">
              <Input id="name" {...register("name", { required: true, minLength: 1 })} />
            </Field>
            <Button type="submit" disabled={updateSettings.isPending || !formState.isDirty}>
              {updateSettings.isPending ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-danger/40">
        <CardHeader>
          <CardTitle className="text-danger">Danger zone</CardTitle>
          <CardDescription>
            Deleting a workspace permanently removes it and all of its tasks and documents.
            This cannot be undone. Type <span className="font-medium text-fg">{overview.workspace.name}</span> to confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <Field label="Confirm workspace name" htmlFor="confirm" className="flex-1">
            <Input
              id="confirm"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={overview.workspace.name}
            />
          </Field>
          <Button
            variant="danger"
            disabled={!canDelete || deleteWorkspace.isPending}
            onClick={() => deleteWorkspace.mutate()}
          >
            {deleteWorkspace.isPending ? "Deleting…" : "Delete workspace"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
