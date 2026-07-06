import mongoose from "mongoose";
import { loadEnv } from "./env.js";
import { logger } from "./logger.js";

/**
 * Connect to MongoDB with production-tuned options. `sanitizeFilter` strips
 * `$`-prefixed operators from user-supplied filter values (belt-and-braces
 * against NoSQL injection). Indexes declared on schemas are synced at boot.
 */
export async function connectDb(uri?: string): Promise<typeof mongoose> {
  const env = loadEnv();
  mongoose.set("sanitizeFilter", true);
  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(uri ?? env.MONGO_URI, {
    retryWrites: true,
    w: "majority",
    readPreference: "primaryPreferred",
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
    autoIndex: true,
  });

  logger.info({ event: "db_connected" }, "MongoDB connected");
  return conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  logger.info({ event: "db_disconnected" }, "MongoDB disconnected");
}
