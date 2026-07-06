import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, authStore } from "@pulse/auth";
import { router } from "./router.js";
import { queryClient } from "./lib/query.js";
import "./app/globals.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/**
 * Keeps the router in sync with auth state: when the session ends (logout or a
 * failed refresh), re-run route guards so protected routes bounce to /login.
 */
function AuthRouterBridge() {
  useEffect(() => {
    let prev = authStore.getState().status;
    return authStore.subscribe((state) => {
      if (state.status !== prev) {
        prev = state.status;
        void router.invalidate();
      }
    });
  }, []);
  return <RouterProvider router={router} />;
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider baseUrl={API_URL}>
        <AuthRouterBridge />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);