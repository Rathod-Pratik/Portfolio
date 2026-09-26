import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type {
    ICreateExpertiseJob,
    IUpdateExpertiseJob,
    IExpertice,
} from "./Expertise.types.ts";

export const EXPERTISE_QUEUE_NAME = "expertise";

export const expertiseQueue =
    new Queue<
        ICreateExpertiseJob | IUpdateExpertiseJob
    >(
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

export const addCreateExpertiseJob = async (
    data: IExpertice
) => {
    return await expertiseQueue.add(
        "create-expertise",
        {
            type: "create",
            data,
        }
    );
};

export const addUpdateExpertiseJob = async (
    expertiseId: string,
    data: Partial<IExpertice>
) => {
    return await expertiseQueue.add(
        "update-expertise",
        {
            type: "update",
            expertiseId,
            data,
        }
    );
};