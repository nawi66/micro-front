import { createContext, useEffect, useMemo, useRef, useState } from "react";
import type { ApiClient } from "@pulse/api-client";
import type { User } from "@pulse/types";
import { buildAuthedClient } from "./auth-client.js";
import { authStore } from "./store.js";

export interface AuthContextValue {
  client: ApiClient;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER: User = {
  id: "mock-user-0000000000000000",
  email: "dev@pulsehq.local",
  name: "Dev User",
  emailVerified: true,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

export interface AuthProviderProps {
  baseUrl: string;
  /** Standalone MFE dev: short-circuit auth with a fixture user (§5). */
  mockAuth?: boolean;
  children: React.ReactNode;
}

/**
 * Sets up the shared API client and restores the session on mount by attempting
 * a silent refresh (the httpOnly cookie rides along). Access tokens live only in
 * memory (the auth store) — never localStorage.
 */
export function AuthProvider({ baseUrl, mockAuth = false, children }: AuthProviderProps) {
  const client = useMemo(() => buildAuthedClient(baseUrl), [baseUrl]);
  const [ready, setReady] = useState(false);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    if (mockAuth) {
      authStore.getState().setSession("mock-access-token", MOCK_USER);
      setReady(true);
      return;
    }

    void (async () => {
      try {
        // A successful refresh (via the client's 401 hook) populates the store,
        // so any authed call here restores the session. If it fails, /auth/me
        // 401s → the store is marked unauthenticated.
        const user = await client.auth.me();
        const token = authStore.getState().accessToken;
        if (token) authStore.getState().setSession(token, user);
        else authStore.getState().setUser(user);
      } catch {
        authStore.getState().markUnauthenticated();
      } finally {
        setReady(true);
      }
    })();
  }, [client, mockAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      async login(email, password) {
        const res = await client.auth.login({ email, password });
        authStore.getState().setSession(res.accessToken, res.user);
        return res.user;
      },
      async register(email, password, name) {
        await client.auth.register({ email, password, name });
        const res = await client.auth.login({ email, password });
        authStore.getState().setSession(res.accessToken, res.user);
        return res.user;
      },
      async logout() {
        try {
          await client.auth.logout();
        } finally {
          authStore.getState().clear();
        }
      },
    }),
    [client],
  );

  if (!ready) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}