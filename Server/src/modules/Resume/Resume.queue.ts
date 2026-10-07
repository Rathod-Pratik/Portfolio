import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type {
    ICreateResumeJob,
    IUpdateResumeJob,
} from "./Resume.types.ts";

export const RESUME_QUEUE_NAME = "resume";

export const resumeQueue = new Queue(
    RESUME_QUEUE_NAME,
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

export const addCreateResumeJob = async (
    data: ICreateResumeJob["data"]
) => {
    return await resumeQueue.add("create", {
        type: "create",
        data,
    });
};

export const addUpdateResumeJob = async (
    resumeId: string,
    data: IUpdateResumeJob["data"]
) => {
    return await resumeQueue.add("update", {
        type: "update",
        resumeId,
        data,
    });
};