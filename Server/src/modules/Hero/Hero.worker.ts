import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { HeroModel } from "./Hero.model.ts";
import {
    getCache,
    setCache,
    Get_Signed_Url,
    HeroCacheKeys,
    HERO_ID,
} from "@utils";
import type { IHeroCacheJob } from "./Hero.types.ts";

const signHeroImage = async <T extends { image?: string }>(
    hero: T
) => {
    if (
        hero.image &&
        typeof hero.image === "string" &&
        !hero.image.startsWith("http")
    ) {
        try {
            const signedUrl = await Get_Signed_Url({
                key: hero.image,
            });

            if (signedUrl) {
                return {
                    ...hero,
                    image: signedUrl,
                };
            }
        } catch (error) {
            console.error(
                "Failed to sign hero image:",
                error
            );
        }
    }

    return hero;
};

export const heroWorker =
    new Worker<IHeroCacheJob>(
        "hero-cache",
        async (job) => {
            const { version } = job.data;

            const cacheKey =
                HeroCacheKeys.details(
                    HERO_ID,
                    version
                );

            const existingCache =
                await getCache(cacheKey);

            if (existingCache) {
                return existingCache;
            }

            const hero =
                await HeroModel.findOne().lean();

            if (!hero) {
                return null;
            }

            const signedHero =
                await signHeroImage(hero);

            await setCache(
                cacheKey,
                signedHero
            );

            return signedHero;
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
            `Hero cache job completed: ${job.id}`
        );
    }
);

heroWorker.on(
    "failed",
    (job, error) => {
        console.error(
            `Hero cache job failed: ${job?.id}`,
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