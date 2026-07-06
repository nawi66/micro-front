import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@pulse/auth";
import AdminApp from "./AdminApp.js";
import "./app.css";

/**
 * Standalone dev entry (§5). Runs the admin MFE on its own with VITE_MOCK_AUTH,
 * providing its own auth + query providers. Point VITE_DEV_WORKSPACE_ID at a
 * real workspace to exercise live data; otherwise this renders the UI shell.
 */
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH === "true";
const WORKSPACE_ID = import.meta.env.VITE_DEV_WORKSPACE_ID ?? "000000000000000000000000";

const queryClient = new QueryClient();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider baseUrl={API_URL} mockAuth={MOCK_AUTH}>
        <AdminApp workspaceId={WORKSPACE_ID} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
