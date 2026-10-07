import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type {
    ICreateSkillJob,
    IUpdateSkillJob,
} from "./Skill.types.ts";


export const SKILL_QUEUE_NAME = "skill";

export const skillQueue = new Queue(
    SKILL_QUEUE_NAME,
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

export const addCreateSkillJob = async (
    data: ICreateSkillJob["data"]
) => {
    return await skillQueue.add("create", {
        type: "create",
        data,
    });
};

export const addUpdateSkillJob = async (
    skillId: string,
    data: IUpdateSkillJob["data"]
) => {
    return await skillQueue.add("update", {
        type: "update",
        skillId,
        data,
    });
};