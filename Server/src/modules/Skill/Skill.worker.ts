import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import {
    SkillCacheKeys,
    incrementCacheVersion,
} from "@utils";
import { SkillsModel } from "./Skills.model.ts";
import type { ISkillJob } from "./Skills.types.ts";


export const skillWorker = new Worker<ISkillJob>(
    "skill",
    async (job) => {
        switch (job.data.type) {
            case "create": {
                await SkillsModel.create(job.data.data);

                await incrementCacheVersion(
                    SkillCacheKeys.listVersion()
                );

                return;
            }

            case "update": {
                const updatedSkill =
                    await SkillsModel.findByIdAndUpdate(
                        job.data.skillId,
                        job.data.data,
                        {
                            new: true,
                        }
                    );

                if (!updatedSkill) {
                    throw new Error("Skill not found");
                }

                await incrementCacheVersion(
                    SkillCacheKeys.listVersion()
                );

                await incrementCacheVersion(
                    SkillCacheKeys.detailsVersion(
                        job.data.skillId
                    )
                );

                return;
            }

            default:
                throw new Error("Unknown Skill job type");
        }
    },
    {
        connection: bellmqConnection,
    }
);

skillWorker.on("completed", (job) => {
    console.log(`Skill job completed: ${job.id}`);
});

skillWorker.on("failed", (job, error) => {
    console.error(
        `Skill job failed: ${job?.id}`,
        error
    );
});