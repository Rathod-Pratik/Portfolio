import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { IHeroCacheJob } from "./Hero.types.ts";

export const HERO_QUEUE_NAME = "hero-cache";

export const heroQueue =
    new Queue<IHeroCacheJob>(
        HERO_QUEUE_NAME,
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
        }
    );

export const addHeroCacheJob = async (
    version: number
) => {
    return await heroQueue.add(
        "hero-cache",
        {
            type: "details",
            version,
        }
    );
};