import { afterAll, afterEach, beforeAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDb, disconnectDb } from "../config/db.js";

/**
 * Spins up an in-memory MongoDB replica set (single node) so multi-document
 * transactions used in the auth/workspace services work in tests. Collections
 * are cleared between tests; indexes persist.
 */
let replset: MongoMemoryReplSet;

beforeAll(async () => {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDb(replset.getUri());
  await mongoose.connection.asPromise();
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await disconnectDb();
  await replset.stop();
});
