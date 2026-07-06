import { useStore } from "zustand";
import type { Role } from "@pulse/types";
import { authStore } from "./store.js";

export interface RequireAuthProps {
  children: React.ReactNode;
  /** Rendered while the session is resolving. */
  loading?: React.ReactNode;
  /** Rendered when unauthenticated (e.g. a login redirect/prompt). */
  fallback?: React.ReactNode;
}

/** Gate that renders children only for an authenticated user. */
export function RequireAuth({ children, loading = null, fallback = null }: RequireAuthProps) {
  const status = useStore(authStore, (s) => s.status);
  if (status === "loading") return <>{loading}</>;
  if (status !== "authenticated") return <>{fallback}</>;
  return <>{children}</>;
}

export interface RequireRoleProps {
  /** The user's role in the active workspace. */
  role: Role | undefined;
  /** Roles permitted to see the children. */
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Coarse client-side role gate. The server is the source of truth for RBAC —
 * this only hides UI the user can't act on. Pass the active-workspace role.
 */
export function RequireRole({ role, allow, children, fallback = null }: RequireRoleProps) {
  if (!role || !allow.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}