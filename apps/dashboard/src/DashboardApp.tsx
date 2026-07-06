import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@pulse/auth";
import type { Task } from "@pulse/types";
import { Card, CardContent, CardHeader, CardTitle, Spinner } from "@pulse/ui";

interface Stat {
  label: string;
  value: number;
  tone: string;
}

/**
 * Dashboard MFE root. Reads the workspace's tasks (via the shared API client)
 * and renders summary stats. Providers come from the host tree.
 */
export default function DashboardApp({ workspaceId }: { workspaceId: string }) {
  const client = useApiClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks", workspaceId],
    queryFn: () => client.tasks.list(workspaceId),
    enabled: Boolean(workspaceId),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-fg-muted">
        <Spinner />
      </div>
    );
  }
  if (isError) {
    return <p className="p-8 text-center text-sm text-danger">Could not load dashboard.</p>;
  }

  const tasks: Task[] = data ?? [];
  const count = (fn: (t: Task) => boolean) => tasks.filter(fn).length;

  const stats: Stat[] = [
    { label: "Total tasks", value: tasks.length, tone: "text-fg" },
    { label: "In progress", value: count((t) => t.status === "in_progress"), tone: "text-primary" },
    { label: "Done", value: count((t) => t.status === "done"), tone: "text-success" },
    { label: "High priority", value: count((t) => t.priority === "high"), tone: "text-danger" },
  ];

  const done = count((t) => t.status === "done");
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-fg">Dashboard</h1>
        <p className="text-sm text-fg-muted">A snapshot of your workspace.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-sm text-fg-muted">{s.label}</p>
              <p className={`mt-1 text-3xl font-semibold ${s.tone}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-medium text-fg-muted">{pct}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}