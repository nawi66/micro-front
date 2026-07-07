import { Badge, Button, Tooltip } from "@pulse/ui";
import { useTaskSummary } from "@pulse/store";

/**
 * Header notification bell. Reads the task summary the `tasks` remote publishes
 * into the shared `@pulse/store`, so the counts stay live across MFEs without
 * the shell importing the tasks app. Hovering/focusing shows a breakdown.
 */
export function NotificationBell() {
  const { todo, inProgress, updatedAt } = useTaskSummary();
  const unread = todo + inProgress;

  const panel = (
    <div className="flex w-52 flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Tasks</p>
      <Row label="To do" value={todo} tone="warning" />
      <Row label="In progress" value={inProgress} tone="primary" />
      <p className="pt-1 text-xs text-fg-subtle">
        {updatedAt ? "Open work across your workspace." : "Open Tasks to load your work."}
      </p>
    </div>
  );

  return (
    <Tooltip content={panel} align="end">
      <Button variant="ghost" size="icon" aria-label={`Notifications: ${unread} open tasks`}>
        <span className="relative inline-flex">
          <span aria-hidden>🔔</span>
          {unread > 0 && (
            <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-danger-fg">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </span>
      </Button>
    </Tooltip>
  );
}

function Row({ label, value, tone }: { label: string; value: number; tone: "warning" | "primary" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-fg-muted">{label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
}
