import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { HeroModel } from "./Hero.model.ts";
import {
    incrementCacheVersion,
    HeroCacheKeys,
    HERO_ID,
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
        console.log(
            `Hero job completed: ${job.id}`
        );
    }
);

heroWorker.on(
    "failed",
    (job, error) => {
        console.error(
            `Hero job failed: ${job?.id}`,
            error
        );
    }
);

heroWorker.on(
    "error",
    (error) => {
        console.error(
            "Hero worker error:",
            error
        );
    }
);