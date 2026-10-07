import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import {
    SkillCacheKeys,
    incrementCacheVersion,
    logger,
} from "@utils";
import { SkillsModel } from "./Skills.model.ts";
import type { ISkillJob } from "./Skill.types.ts";

export const skillWorker = new Worker<ISkillJob>(
    "skill",
    async (job) => {
        switch (job.data.type) {
            case "create": {
                const skill = await SkillsModel.create(job.data.data);

                await incrementCacheVersion(
                    SkillCacheKeys.listVersion()
                );

                await logger.info(`Skill created in DB: ${skill.language}`, {
                    context: "SkillWorker",
                    metadata: { skillId: skill._id.toString(), jobId: job.id },
                });

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
                    await logger.warn(`Skill worker update failed: ID not found: ${job.data.skillId}`, { context: "SkillWorker" });
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

                await logger.info(`Skill updated in DB for ID: ${job.data.skillId}`, {
                    context: "SkillWorker",
                    metadata: { skillId: job.data.skillId, jobId: job.id },
                });

                return;
            }

            default:
                throw new Error("Unknown Skill job type");
        }
    },
    {
        connection: bellmqConnection,
        skipVersionCheck: true,
    }
);

skillWorker.on("completed", (job) => {
    logger.info(`Skill job completed: ${job.id}`, { context: "SkillWorker", metadata: { jobId: job.id } });
});

skillWorker.on("failed", (job, error) => {
    logger.error(
        `Skill job failed: ${job?.id}`,
        error instanceof Error ? error : { context: "SkillWorker", metadata: { jobId: job?.id, error: String(error) } }
    );
});
