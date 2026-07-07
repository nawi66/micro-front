import { create } from "zustand";
import { persist } from "zustand/middleware";

/** A snapshot of open work, published by the tasks remote, read by the shell. */
export interface TaskSummary {
  todo: number;
  inProgress: number;
  total: number;
  /** Epoch ms of the last publish, or null if never populated. */
  updatedAt: number | null;
}

interface NotificationState {
  tasks: TaskSummary;
  setTaskSummary: (summary: { todo: number; inProgress: number; total: number }) => void;
  reset: () => void;
}

const EMPTY: TaskSummary = { todo: 0, inProgress: 0, total: 0, updatedAt: null };

/**
 * Cross-MFE notification state. The `tasks` remote writes its counts here; the
 * shell header reads them via `useTaskSummary`. Because `@pulse/store` is a
 * shared federation singleton, both sides touch the same instance (§5).
 * Persisted so the badge is populated immediately after a refresh.
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      tasks: EMPTY,
      setTaskSummary: (summary) => set({ tasks: { ...summary, updatedAt: Date.now() } }),
      reset: () => set({ tasks: EMPTY }),
    }),
    {
      name: "pulse-notifications",
      partialize: (s) => ({ tasks: s.tasks }),
    },
  ),
);

/** Reactive selector for just the task summary. */
export const useTaskSummary = (): TaskSummary => useNotificationStore((s) => s.tasks);
