import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import federation from "@originjs/vite-plugin-federation";

/**
 * tasks = federation remote. Exposes its root component from bootstrap. The
 * shared singletons MUST match the shell so React context, the auth store, and
 * the query cache are the same instances at runtime.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    federation({
      name: "tasks",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/bootstrap.tsx",
      },
      shared: ["react", "react-dom", "@tanstack/react-query", "@pulse/auth", "@pulse/ui"],
    }),
  ],
  server: { port: 3002, strictPort: true },
  preview: { port: 3002, strictPort: true },
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
});