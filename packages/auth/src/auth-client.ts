import { createClient, type ApiClient } from "@pulse/api-client";
import type { User } from "@pulse/types";
import { authStore, getAccessToken } from "./store.js";

interface RefreshResponse {
  accessToken: string;
  user: User;
}

/**
 * Build the shared API client. The `refresh` hook is a raw call to /auth/refresh
 * (bypassing the retry loop) so a 401 anywhere transparently rotates the token
 * and retries once. The refresh cookie rides along via credentials: 'include'.
 */
export function buildAuthedClient(baseUrl: string): ApiClient {
  let inFlight: Promise<boolean> | null = null;

  async function refresh(): Promise<boolean> {
    // Collapse concurrent refreshes into one network call.
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          authStore.getState().markUnauthenticated();
          return false;
        }
        const body = (await res.json()) as RefreshResponse;
        authStore.getState().setSession(body.accessToken, body.user);
        return true;
      } catch {
        authStore.getState().markUnauthenticated();
        return false;
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  return createClient({ baseUrl, getToken: getAccessToken, refresh });
}