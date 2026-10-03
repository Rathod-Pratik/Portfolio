import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ExperienceModel } from "./Experience.model.ts";
import {
    incrementCacheVersion,
    ExperienceCacheKeys,
    logger,
} from "@utils";
import type { IExperienceJob } from "./Experience.types.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";

export const experienceWorker = new Worker<IExperienceJob>(
    "experience",
    async (job) => {
        if (job.data.type === "create") {
            const experience = await ExperienceModel.create(
                job.data.data
            );

            await incrementCacheVersion(
                ExperienceCacheKeys.listVersion()
            );
            
            await sendInfoNotification(
                "Experience Creation",
                `New experience created: ${experience.title}.`
            );

            await logger.info(`Experience created in DB: ${experience.title}`, {
                context: "ExperienceWorker",
                metadata: { experienceId: experience._id.toString(), jobId: job.id },
            });

            return experience;
        }

        const { experienceId, data } = job.data;

        const experience =
            await ExperienceModel.findByIdAndUpdate(
                experienceId,
                data,
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!experience) {
            await logger.warn(`Experience worker update failed: ID not found: ${experienceId}`, { context: "ExperienceWorker" });
            throw new Error("Experience not found");
        }

        await incrementCacheVersion(
            ExperienceCacheKeys.listVersion()
        );

        await incrementCacheVersion(
            ExperienceCacheKeys.detailsVersion(
                experienceId
            )
        );

        await sendInfoNotification(
            "Experience Update",
            `Experience updated: ${experience.title}.`
        );

        await logger.info(`Experience updated in DB for ID: ${experienceId}`, {
            context: "ExperienceWorker",
            metadata: { experienceId, jobId: job.id },
        });

        return experience;
    },
    {
        connection: bellmqConnection,
        concurrency: 5,
    }
);

experienceWorker.on(
    "completed",
    (job) => {
        logger.info(`Experience job completed: ${job.id}`, { context: "ExperienceWorker", metadata: { jobId: job.id } });
    }
);

experienceWorker.on(
    "failed",
    (job, error) => {
        logger.error(
            `Experience job failed: ${job?.id}`,
            error instanceof Error ? error : { context: "ExperienceWorker", metadata: { jobId: job?.id, error: String(error) } }
        );
    }
);

experienceWorker.on(
    "error",
    (error) => {
        logger.error(
            "Experience worker error",
            error instanceof Error ? error : { context: "ExperienceWorker", metadata: { error: String(error) } }
        );
    }
);