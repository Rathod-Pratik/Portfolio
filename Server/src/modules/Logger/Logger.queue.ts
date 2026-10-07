import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { ILoggerJob } from "./Logger.types.ts";

export const loggerQueue = new Queue<ILoggerJob>("logger", {
  connection: bellmqConnection,
  skipVersionCheck: true,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export const addLogJob = async (data: ILoggerJob) => {
  return await loggerQueue.add("create-log", data);
};
