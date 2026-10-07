import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { IHero, IHeroJob } from "./Hero.types.ts";

export const HERO_QUEUE_NAME = "hero";

export const heroQueue =
    new Queue<IHeroJob>(
        HERO_QUEUE_NAME,
        {
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
        }
    );

export const addUpdateHeroJob = async (
    data: Partial<IHero>
) => {
    return await heroQueue.add(
        "update-hero",
        {
            type: "update",
            data,
        }
    );
};