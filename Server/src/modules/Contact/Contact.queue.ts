import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";

export interface IContactCacheJob {
    version: number;
    page: number;
    limit: number;
}

export const contactQueue = new Queue<IContactCacheJob>(
    'contact',
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

export const addContactCacheJob = async (
    version: number,
    page: number,
    limit: number
) => {
    return await contactQueue.add(
        "cache-contact",
        {
            version,
            page,
            limit,
        }
    );
};