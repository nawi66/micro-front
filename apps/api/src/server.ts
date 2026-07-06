import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { logger } from "./config/logger.js";

async function main(): Promise<void> {
  const env = loadEnv(); // validate config at boot — fail loudly if invalid
  await connectDb();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ event: "server_started", port: env.PORT }, `API listening on :${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info({ event: "shutdown", signal }, "shutting down");
    server.close(() => {
      void disconnectDb().finally(() => process.exit(0));
    });
    // Force-exit if graceful shutdown stalls.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal({ err }, "fatal boot error");
  process.exit(1);
});
