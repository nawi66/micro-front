import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import federation from "@originjs/vite-plugin-federation";

/** dashboard = federation remote. Exposes its root component from bootstrap. */
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    federation({
      name: "dashboard",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/bootstrap.tsx",
      },
      shared: ["react", "react-dom", "@tanstack/react-query", "@pulse/auth", "@pulse/ui"],
    }),
  ],
  server: { port: 3001, strictPort: true },
  preview: { port: 3001, strictPort: true },
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
});