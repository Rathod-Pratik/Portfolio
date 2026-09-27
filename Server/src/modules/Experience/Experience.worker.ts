import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ExperienceModel } from "./Experience.model.ts";
import {
    incrementCacheVersion,
    ExperienceCacheKeys,
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
        console.log(
            `Experience job completed: ${job.id}`
        );
    }
);

experienceWorker.on(
    "failed",
    (job, error) => {
        console.error(
            `Experience job failed: ${job?.id}`,
            error
        );
    }
);

experienceWorker.on(
    "error",
    (error) => {
        console.error(
            "Experience worker error:",
            error
        );
    }
);