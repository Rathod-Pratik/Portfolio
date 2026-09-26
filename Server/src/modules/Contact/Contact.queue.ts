import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";

export interface ICreateContactJob {
    name: string;
    email: string;
    mobile: string;
    message: string;
}

export const contactQueue = new Queue<ICreateContactJob>(
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

export const CreateContactJob = async (
    item: ICreateContactJob
) => {
    return await contactQueue.add(
        "cache-contact",item
    );
};