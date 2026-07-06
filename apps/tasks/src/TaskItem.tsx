import type { Task, TaskStatus } from "@pulse/types";
import { Badge, Button, cn } from "@pulse/ui";

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

const PRIORITY_TONE = {
  low: "neutral",
  medium: "primary",
  high: "danger",
} as const;

interface TaskItemProps {
  task: Task;
  onAdvance: (task: Task) => void;
  onDelete: (task: Task) => void;
  busy?: boolean;
}

export function TaskItem({ task, onAdvance, onDelete, busy }: TaskItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-surface-raised p-3">
      <button
        type="button"
        aria-label="Advance status"
        onClick={() => onAdvance(task)}
        disabled={busy}
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] transition-colors",
          task.status === "done"
            ? "border-success bg-success text-surface-raised"
            : task.status === "in_progress"
              ? "border-primary text-primary"
              : "border-border text-transparent hover:border-primary",
        )}
        title={`Status: ${task.status.replace("_", " ")} — click to advance`}
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-fg",
            task.status === "done" && "text-fg-subtle line-through",
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">{task.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
          <Badge tone="neutral">{task.status.replace("_", " ")}</Badge>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(task)}
        disabled={busy}
        aria-label="Delete task"
      >
        ✕
      </Button>
    </div>
  );
}

export { NEXT_STATUS };