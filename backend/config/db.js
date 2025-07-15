import mongoose from "mongoose";
import { logger } from "../middleware/logger.js";

/**
 * Establishes the MongoDB connection.
 *
 * A single connection pool is shared process-wide (Mongoose default
 * maxPoolSize is 100; we cap it so multiple app instances stay within
 * the Atlas connection limit). Failing to connect is fatal — the process
 * exits so an orchestrator (PM2, Docker, k8s) can restart it.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: Number(process.env.DB_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("Database connection failed", { message: err.message });
    process.exit(1);
  }
};

/**
 * Runs a function inside a transaction with automatic retry on transient
 * errors (write conflicts, primary step-downs). session.withTransaction
 * handles the retry loop per the MongoDB driver contract.
 *
 * This is the concurrency-control backbone: when two bookings contend for
 * the last slot, one transaction commits and the other hits a write
 * conflict and is retried by this helper.
 */
export const withTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};
