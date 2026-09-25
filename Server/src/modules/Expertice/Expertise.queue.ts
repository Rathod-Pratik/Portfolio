import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { IExpertiseCacheJob } from "./Expertise.types.ts";

export const EXPERTISE_QUEUE_NAME = "expertise-cache";

export const expertiseQueue =
    new Queue<IExpertiseCacheJob>(
        EXPERTISE_QUEUE_NAME,
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

export const addExpertiseListCacheJob = async (
    version: number,
    page: number,
    limit: number
) => {
    return await expertiseQueue.add(
        "expertise-list-cache",
        {
            type: "list",
            version,
            page,
            limit,
        }
    );
};

export const addExpertiseDetailsCacheJob = async (
    expertiseId: string,
    version: number
) => {
    return await expertiseQueue.add(
        "expertise-details-cache",
        {
            type: "details",
            expertiseId,
            version,
        }
    );
};