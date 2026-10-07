import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type {
    ICreateProjectJob,
    IUpdateProjectJob,
} from "./Project.types.ts";

export const PROJECT_QUEUE_NAME = "project";

export const projectQueue = new Queue(
    PROJECT_QUEUE_NAME,
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

export const addCreateProjectJob = async (
    data: ICreateProjectJob["data"]
) => {
    return await projectQueue.add("create", {
        type: "create",
        data,
    });
};

export const addUpdateProjectJob = async (
    projectId: string,
    data: IUpdateProjectJob["data"]
) => {
    return await projectQueue.add("update", {
        type: "update",
        projectId,
        data,
    });
};