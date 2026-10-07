import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { IExperienceJob, IExperience } from "./Experience.types.ts";

export const EXPERIENCE_QUEUE_NAME = "experience";

export const experienceQueue = new Queue<IExperienceJob>(
    EXPERIENCE_QUEUE_NAME,
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

export const addCreateExperienceJob = async (
    data: IExperience
) => {
    return await experienceQueue.add(
        "create-experience",
        {
            type: "create",
            data,
        }
    );
};

export const addUpdateExperienceJob = async (
    experienceId: string,
    data: IExperience
) => {
    return await experienceQueue.add(
        "update-experience",
        {
            type: "update",
            experienceId,
            data,
        }
    );
};