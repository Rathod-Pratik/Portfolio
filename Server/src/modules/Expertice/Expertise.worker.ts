import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ExpertiseModel } from "./expertise.model.ts";
import {
    getCache,
    setCache,
    Get_Signed_Url,
    ExpertiseCacheKeys,
} from "@utils";
import type { IExpertiseCacheJob } from "./Expertise.types.ts";

const signImage = async <T extends { image?: string }>(
    expertise: T
) => {
    if (
        expertise.image &&
        typeof expertise.image === "string" &&
        !expertise.image.startsWith("http")
    ) {
        try {
            const signedUrl = await Get_Signed_Url({
                key: expertise.image,
            });

            if (signedUrl) {
                return {
                    ...expertise,
                    image: signedUrl,
                };
            }
        } catch (error) {
            console.error(
                "Failed to sign expertise image:",
                error
            );
        }
    }

    return expertise;
};

export const expertiseWorker =
    new Worker<IExpertiseCacheJob>(
        "expertise-cache",
        async (job) => {
            if (job.data.type === "list") {
                const {
                    version,
                    page,
                    limit,
                } = job.data;

                const cacheKey =
                    ExpertiseCacheKeys.list(
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

                const expertise =
                    await ExpertiseModel.find()
                        .sort({ createdAt: 1 })
                        .skip(skip)
                        .limit(limit)
                        .lean();

                const signedExpertise =
                    await Promise.all(
                        expertise.map((item) =>
                            signImage(item)
                        )
                    );

                await setCache(
                    cacheKey,
                    signedExpertise
                );

                return signedExpertise;
            }

            const {
                expertiseId,
                version,
            } = job.data;

            const cacheKey =
                ExpertiseCacheKeys.details(
                    expertiseId,
                    version
                );

            const existingCache =
                await getCache(cacheKey);

            if (existingCache) {
                return existingCache;
            }

            const expertise =
                await ExpertiseModel
                    .findById(expertiseId)
                    .lean();

            if (!expertise) {
                return null;
            }

            const signedExpertise =
                await signImage(expertise);

            await setCache(
                cacheKey,
                signedExpertise
            );

            return signedExpertise;
        },
        {
            connection: bellmqConnection,
            concurrency: 5,
        }
    );

expertiseWorker.on(
    "completed",
    (job) => {
        console.log(
            `Expertise cache job completed: ${job.id}`
        );
    }
);

expertiseWorker.on(
    "failed",
    (job, error) => {
        console.error(
            `Expertise cache job failed: ${job?.id}`,
            error
        );
    }
);

expertiseWorker.on(
    "error",
    (error) => {
        console.error(
            "Expertise worker error:",
            error
        );
    }
);