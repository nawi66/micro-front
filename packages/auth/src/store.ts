import { createStore } from "zustand/vanilla";
import type { User } from "@pulse/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  /** In-memory access token — never persisted to storage. */
  accessToken: string | null;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  clear: () => void;
  markUnauthenticated: () => void;
}

/**
 * A vanilla Zustand store held as a module singleton. Because @pulse/auth is a
 * shared federation singleton, every MFE reads the same auth state (§5).
 */
export const authStore = createStore<AuthState>((set) => ({
  status: "loading",
  user: null,
  accessToken: null,
  setSession: (accessToken, user) => set({ accessToken, user, status: "authenticated" }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null, status: "unauthenticated" }),
  markUnauthenticated: () => set({ status: "unauthenticated", user: null, accessToken: null }),
}));

/** Non-reactive token getter for the API client. */
export function getAccessToken(): string | null {
  return authStore.getState().accessToken;
}