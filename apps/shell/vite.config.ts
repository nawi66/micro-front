import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import federation from "@originjs/vite-plugin-federation";

/**
 * Shell = federation host. It declares each remote's remoteEntry URL and the
 * singletons shared across the shell + all MFEs. React/query/auth/ui MUST be
 * singletons so context, the auth store, and the query cache are shared.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const dashboardUrl = env.VITE_REMOTE_DASHBOARD ?? "http://localhost:3001/assets/remoteEntry.js";
  const tasksUrl = env.VITE_REMOTE_TASKS ?? "http://localhost:3002/assets/remoteEntry.js";

  return {
    plugins: [
      react(),
      tailwind(),
      federation({
        name: "shell",
        remotes: {
          dashboard: dashboardUrl,
          tasks: tasksUrl,
        },
        shared: ["react", "react-dom", "@tanstack/react-query", "@pulse/auth", "@pulse/ui"],
      }),
    ],
    server: { port: 3000, strictPort: true },
    preview: { port: 3000, strictPort: true },
    build: {
      target: "esnext",
      minify: false,
      cssCodeSplit: false,
    },
  };
});