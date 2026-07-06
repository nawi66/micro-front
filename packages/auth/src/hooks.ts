import { useContext } from "react";
import { useStore } from "zustand";
import type { User } from "@pulse/types";
import { AuthContext, type AuthContextValue } from "./AuthProvider.js";
import { authStore, type AuthStatus } from "./store.js";

function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export interface UseAuthResult extends AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
}

/** Full auth surface: session state + actions + the shared API client. */
export function useAuth(): UseAuthResult {
  const ctx = useAuthContext();
  const status = useStore(authStore, (s) => s.status);
  const user = useStore(authStore, (s) => s.user);
  return { ...ctx, user, status, isAuthenticated: status === "authenticated" };
}

/** The current user, or throws if unauthenticated. Use behind <RequireAuth>. */
export function useUser(): User {
  const user = useStore(authStore, (s) => s.user);
  if (!user) throw new Error("useUser called without an authenticated user");
  return user;
}

/** Reactive access to just the shared API client. */
export function useApiClient() {
  return useAuthContext().client;
}