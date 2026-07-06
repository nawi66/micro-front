import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@pulse/api-client";

/** Shared query client. Don't retry 4xx — those are deterministic (auth, validation). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});