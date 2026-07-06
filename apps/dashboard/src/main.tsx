import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@pulse/auth";
import DashboardApp from "./DashboardApp.js";
import "./app.css";

/** Standalone dev entry (§5) — own providers, mock auth. */
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
        <DashboardApp workspaceId={WORKSPACE_ID} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);