import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
export const aboutQueue = new Queue('about',
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

export const addAboutCacheJob = async (
    data: {
        id?: string;
        content?: string;
        version?: number;
    }
) => {
    return await aboutQueue.add(
        "cache-about",
        data
    );
};