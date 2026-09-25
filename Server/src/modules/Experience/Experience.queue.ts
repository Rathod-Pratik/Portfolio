import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { IExperienceCacheJob } from "./Experience.types.ts";

export const EXPERIENCE_QUEUE_NAME = "experience-cache";

export const experienceQueue =
    new Queue<IExperienceCacheJob>(
        EXPERIENCE_QUEUE_NAME,
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

export const addExperienceListCacheJob = async (
    version: number,
    page: number,
    limit: number
) => {
    return await experienceQueue.add(
        "experience-list-cache",
        {
            type: "list",
            version,
            page,
            limit,
        }
    );
};

export const addExperienceDetailsCacheJob = async (
    experienceId: string,
    version: number
) => {
    return await experienceQueue.add(
        "experience-details-cache",
        {
            type: "details",
            experienceId,
            version,
        }
    );
};