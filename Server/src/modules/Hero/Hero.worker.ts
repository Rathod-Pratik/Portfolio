import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { HeroModel } from "./Hero.model.ts";
import {
    incrementCacheVersion,
    HeroCacheKeys,
    HERO_ID,
    logger,
} from "@utils";
import type { IHeroJob } from "./Hero.types.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.index.ts";

export const heroWorker =
    new Worker<IHeroJob>(
        "hero",
        async (job) => {
            const { data } = job.data;

            const hero =
                await HeroModel.findOneAndUpdate(
                    {},
                    data,
                    {
                        new: true,
                        upsert: true,
                        setDefaultsOnInsert: true,
                        runValidators: true,
                    }
                );

            await incrementCacheVersion(
                HeroCacheKeys.detailsVersion(HERO_ID)
            );

            await sendInfoNotification(
                "Hero Update",
                `Hero updated: ${hero.name}.`
            );

            await logger.info(`Hero updated in DB: ${hero.name}`, {
                context: "HeroWorker",
                metadata: { jobId: job.id, name: hero.name },
            });

            return hero;
        },
        {
            connection: bellmqConnection,
            concurrency: 5,
        }
    );

heroWorker.on(
    "completed",
    (job) => {
        logger.info(`Hero job completed: ${job.id}`, { context: "HeroWorker", metadata: { jobId: job.id } });
    }
);

heroWorker.on(
    "failed",
    (job, error) => {
        logger.error(
            `Hero job failed: ${job?.id}`,
            error instanceof Error ? error : { context: "HeroWorker", metadata: { jobId: job?.id, error: String(error) } }
        );
    }
);

heroWorker.on(
    "error",
    (error) => {
        logger.error(
            "Hero worker error",
            error instanceof Error ? error : { context: "HeroWorker", metadata: { error: String(error) } }
        );
    }
);
