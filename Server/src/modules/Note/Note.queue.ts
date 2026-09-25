import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { INoteCacheJob } from "./Note.types.ts";

export const NOTE_QUEUE_NAME = "note";

export const noteQueue = new Queue<INoteCacheJob>(
    NOTE_QUEUE_NAME,
    {
        connection: bellmqConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000,
            },
            removeOnComplete: 100,
            removeOnFail: 100,
        },
    },
);