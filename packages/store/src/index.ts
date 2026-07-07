/**
 * @pulse/store — shared client state for the shell + all MFEs.
 *
 * A federation singleton (like @pulse/auth): every app reads the same store
 * instances at runtime, which is how the shell and remotes communicate without
 * importing each other (§5). Built on Zustand + the `persist` middleware, so
 * state survives a page refresh.
 */
export { useTheme } from "./theme.js";
export type { Theme } from "./theme.js";
export { useWorkspaceStore } from "./workspace.js";
export { useNotificationStore, useTaskSummary } from "./notifications.js";
export type { TaskSummary } from "./notifications.js";
