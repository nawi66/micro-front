import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Spinner } from "@pulse/ui";
import { RemoteErrorBoundary } from "./RemoteErrorBoundary.js";

type RemoteComponent = ComponentType<{ workspaceId: string }>;

// Lazy-load each remote's default export. React/query/auth/ui are shared
// singletons (declared in vite.config), so the remote reuses the shell's copies.
const remotes: Record<string, LazyExoticComponent<RemoteComponent>> = {
  dashboard: lazy(() => import("dashboard/App")),
  tasks: lazy(() => import("tasks/App")),
  docs: lazy(() => import("docs/App")),
  team: lazy(() => import("team/App")),
  admin: lazy(() => import("admin/App")),
};

interface RemoteMountProps {
  name: keyof typeof remotes | string;
  workspaceId: string;
}

/** Renders a federated MFE inside an error boundary + suspense fallback. */
export function RemoteMount({ name, workspaceId }: RemoteMountProps) {
  const Remote = remotes[name];
  if (!Remote) {
    return <div className="p-8 text-sm text-fg-muted">Unknown module: {name}</div>;
  }
  return (
    <RemoteErrorBoundary name={name}>
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center p-8 text-fg-muted">
            <Spinner />
          </div>
        }
      >
        <Remote workspaceId={workspaceId} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}