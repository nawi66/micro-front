import { Spinner } from "@pulse/ui";
import { RemoteMount } from "../components/RemoteMount.js";
import { useWorkspaces } from "../hooks/useWorkspaces.js";
import { NoWorkspace } from "./NoWorkspace.js";

/**
 * Host page for a federated MFE. Resolves the active workspace, then mounts the
 * remote with its id. No workspace → onboarding; still loading → spinner.
 */
type Remote = "dashboard" | "tasks" | "docs" | "team" | "admin";

export function RemotePage({ remote }: { remote: Remote }) {
  const { active, isLoading, isError } = useWorkspaces();
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-fg-muted">
        <Spinner />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="grid h-full place-items-center p-8 text-sm text-danger">
        Failed to load your workspaces.
      </div>
    );
  }
  if (!active) return <NoWorkspace />;

  return <RemoteMount name={remote} workspaceId={active.id} />;
}