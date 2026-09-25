import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ExperienceModel } from "./Experience.model.ts";
import {
    getCache,
    setCache,
    ExperienceCacheKeys,
} from "@utils";
import type { IExperienceCacheJob } from "./Experience.types.ts";

export const experienceWorker =
    new Worker<IExperienceCacheJob>(
        "experience-cache",
        async (job) => {
            if (job.data.type === "list") {
                const {
                    version,
                    page,
                    limit,
                } = job.data;

                const cacheKey =
                    ExperienceCacheKeys.list(
                        version,
                        page,
                        limit
                    );

                const existingCache =
                    await getCache(cacheKey);

                if (existingCache) {
                    return existingCache;
                }

                const skip = (page - 1) * limit;

                const experiences =
                    await ExperienceModel.find()
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .lean();

                await setCache(
                    cacheKey,
                    experiences
                );

                return experiences;
            }

            const {
                experienceId,
                version,
            } = job.data;

            const cacheKey =
                ExperienceCacheKeys.details(
                    experienceId,
                    version
                );

            const existingCache =
                await getCache(cacheKey);

            if (existingCache) {
                return existingCache;
            }

            const experience =
                await ExperienceModel.findById(
                    experienceId
                ).lean();

            if (!experience) {
                return null;
            }

            await setCache(
                cacheKey,
                experience
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
            `Experience cache job completed: ${job.id}`
        );
    }
);

experienceWorker.on(
    "failed",
    (job, error) => {
        console.error(
            `Experience cache job failed: ${job?.id}`,
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