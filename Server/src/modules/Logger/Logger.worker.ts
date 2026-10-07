import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { LoggerCacheKeys, incrementCacheVersion } from "@utils";
import type { ILoggerJob } from "./Logger.types.ts";
import { LoggerModel } from "./Logger.model.ts";

export const loggerWorker = new Worker<ILoggerJob>(
  "logger",
  async (job) => {
    const { level, message, context, metadata, stack } = job.data;

    const log = await LoggerModel.create({
      level,
      message,
      context: context || "Application",
      metadata: metadata || {},
      stack,
    });

    await incrementCacheVersion(
      LoggerCacheKeys.listVersion()
    );

    console.log(`Log saved with ID: ${log._id.toString()} [${level.toUpperCase()}]`);
    return log;
  },
  {
    connection: bellmqConnection,
    skipVersionCheck: true,
    concurrency: 5,
  }
);

loggerWorker.on("completed", (job) => {
  console.log(`Logger job completed: ${job.id}`);
});

loggerWorker.on("failed", (job, error) => {
  console.error(`Logger job failed: ${job?.id}`, error);
});

loggerWorker.on("error", (error) => {
  console.error("Logger worker error:", error);
});
