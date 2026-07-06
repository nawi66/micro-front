import { useForm } from "react-hook-form";
import type { Task, TaskPriority } from "@pulse/types";
import { Button, Field, Input, Spinner } from "@pulse/ui";
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from "./hooks/useTasks.js";
import { NEXT_STATUS, TaskItem } from "./TaskItem.js";

interface NewTaskForm {
  title: string;
  priority: TaskPriority;
}

const STATUS_ORDER = ["todo", "in_progress", "done"] as const;
const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" } as const;

/**
 * Tasks MFE root. Assumes an AuthProvider + QueryClientProvider are in the tree
 * (provided by the shell in production, or by the standalone dev entry).
 * Receives the active workspace id from the shell as a prop.
 */
export default function TasksApp({ workspaceId }: { workspaceId: string }) {
  const tasksQuery = useTasks(workspaceId);
  const createTask = useCreateTask(workspaceId);
  const updateTask = useUpdateTask(workspaceId);
  const deleteTask = useDeleteTask(workspaceId);

  const { register, handleSubmit, reset, formState } = useForm<NewTaskForm>({
    defaultValues: { title: "", priority: "medium" },
  });

  const onCreate = handleSubmit(async (values) => {
    await createTask.mutateAsync({ title: values.title.trim(), priority: values.priority });
    reset();
  });

  const advance = (task: Task) =>
    updateTask.mutate({ id: task.id, input: { status: NEXT_STATUS[task.status] } });

  const tasks = tasksQuery.data ?? [];
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: tasks.filter((t) => t.status === status),
  }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-fg">Tasks</h1>
        <p className="text-sm text-fg-muted">Track and move work across your workspace.</p>
      </header>

      <form
        onSubmit={onCreate}
        className="flex items-end gap-3 rounded-card border border-glass-border bg-glass p-4 shadow-xl shadow-black/5 backdrop-blur-xl"
      >
        <Field label="New task" htmlFor="title" className="flex-1">
          <Input
            id="title"
            placeholder="What needs doing?"
            {...register("title", { required: true, minLength: 1 })}
          />
        </Field>
        <Field label="Priority" htmlFor="priority">
          <select
            id="priority"
            className="h-11 rounded-md border border-glass-border bg-glass-raised px-3 text-sm text-fg backdrop-blur-md focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            {...register("priority")}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
        <Button type="submit" disabled={createTask.isPending || !formState.isValid}>
          {createTask.isPending ? "Adding…" : "Add task"}
        </Button>
      </form>

      {tasksQuery.isLoading ? (
        <div className="flex justify-center py-12 text-fg-muted">
          <Spinner />
        </div>
      ) : tasksQuery.isError ? (
        <p className="py-12 text-center text-sm text-danger">Could not load tasks.</p>
      ) : tasks.length === 0 ? (
        <p className="py-12 text-center text-sm text-fg-muted">
          No tasks yet. Add your first one above.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {grouped.map(({ status, items }) => (
            <section key={status} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                {STATUS_LABEL[status]} · {items.length}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onAdvance={advance}
                    onDelete={(t) => deleteTask.mutate(t.id)}
                    busy={updateTask.isPending || deleteTask.isPending}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}