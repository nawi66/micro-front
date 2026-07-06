import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // Integration tests share one in-memory Mongo; run files sequentially.
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    // Static, non-secret config so loadEnv() passes on first import. MONGO_URI is
    // a placeholder — the real in-memory URI is passed to connectDb() in setup.
    env: {
      NODE_ENV: "test",
      MONGO_URI: "mongodb://placeholder:27017/pulsehq-test",
      JWT_ACCESS_SECRET: "test-access-secret-0000000000000000000000000000",
      JWT_ACCESS_TTL_SECONDS: "900",
      REFRESH_TOKEN_PEPPER: "test-pepper-000000000000000000000000000000000000",
      REFRESH_TOKEN_TTL_DAYS: "30",
      CORS_ORIGINS: "http://localhost:3000",
      COOKIE_SECURE: "false",
      LOG_LEVEL: "silent",
    },
  },
});
