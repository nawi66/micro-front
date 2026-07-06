import type { ZodType } from "zod";
import { ApiError } from "./errors.js";

export interface CreateClientOptions {
  baseUrl: string;
  /** Returns the current in-memory access token, or null if signed out. */
  getToken: () => string | null;
  /**
   * Called once on a 401 to attempt a token refresh. Returns true if a new
   * token is now available (the request is then retried once). Provided by
   * @pulse/auth so refresh logic lives in one place.
   */
  refresh?: () => Promise<boolean>;
}

export interface RequestOptions<T> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Zod schema to validate and type the JSON response. Omit for 204. */
  schema?: ZodType<T>;
  /** Skip the 401 auto-refresh+retry (used by the refresh call itself). */
  skipRefresh?: boolean;
  signal?: AbortSignal;
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions<unknown>["query"],
): string {
  const url = new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export interface HttpClient {
  request<T = void>(path: string, opts?: RequestOptions<T>): Promise<T>;
}

/**
 * The typed fetch wrapper. Always sends credentials (so the refresh cookie
 * rides along), attaches the bearer token, validates responses with Zod, and
 * transparently refreshes + retries once on a 401.
 */
export function createHttpClient(options: CreateClientOptions): HttpClient {
  const { baseUrl, getToken, refresh } = options;

  async function doFetch<T>(path: string, opts: RequestOptions<T>, isRetry: boolean): Promise<T> {
    const method = opts.method ?? "GET";
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let bodyInit: BodyInit | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      bodyInit = JSON.stringify(opts.body);
    }

    const res = await fetch(buildUrl(baseUrl, path, opts.query), {
      method,
      headers,
      body: bodyInit,
      credentials: "include",
      signal: opts.signal,
    });

    // 401 → try a single refresh + retry.
    if (res.status === 401 && !opts.skipRefresh && !isRetry && refresh) {
      const refreshed = await refresh();
      if (refreshed) return doFetch(path, opts, true);
    }

    if (res.status === 204 || res.status === 205) {
      return undefined as T;
    }

    const text = await res.text();
    const json: unknown = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
      const envelope = (json ?? {}) as {
        error?: string;
        message?: string;
        requestId?: string;
        details?: unknown;
      };
      throw new ApiError(
        res.status,
        envelope.error ?? "error",
        envelope.message ?? res.statusText,
        { requestId: envelope.requestId, details: envelope.details },
      );
    }

    return opts.schema ? opts.schema.parse(json) : (json as T);
  }

  return {
    request<T = void>(path: string, opts: RequestOptions<T> = {}): Promise<T> {
      return doFetch<T>(path, opts, false);
    },
  };
}