import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ExpertiseModel } from "./Expertise.model.ts";
import {
    incrementCacheVersion,
    ExpertiseCacheKeys,
    logger,
} from "@utils";
import type { IExpertiseJob } from "./Expertise.types.ts";

export const expertiseWorker =
    new Worker<IExpertiseJob>(
        "expertise",
        async (job) => {
            if (job.data.type === "create") {
                const expertise =
                    await ExpertiseModel.create(
                        job.data.data
                    );

                await incrementCacheVersion(
                    ExpertiseCacheKeys.listVersion()
                );

                await logger.info(`Expertise created in DB: ${expertise.title}`, {
                    context: "ExpertiseWorker",
                    metadata: { expertiseId: expertise._id.toString(), jobId: job.id },
                });

                return expertise;
            }

            const {
                expertiseId,
                data,
            } = job.data;

            const expertise =
                await ExpertiseModel.findByIdAndUpdate(
                    expertiseId,
                    data,
                    {
                        new: true,
                        runValidators: true,
                    }
                );

            if (!expertise) {
                await logger.warn(`Expertise worker update failed: ID not found: ${expertiseId}`, { context: "ExpertiseWorker" });
                throw new Error(
                    "Expertise not found"
                );
            }

            await incrementCacheVersion(
                ExpertiseCacheKeys.listVersion()
            );

            await incrementCacheVersion(
                ExpertiseCacheKeys.detailsVersion(
                    expertiseId
                )
            );

            await logger.info(`Expertise updated in DB for ID: ${expertiseId}`, {
                context: "ExpertiseWorker",
                metadata: { expertiseId, jobId: job.id },
            });

            return expertise;
        },
        {
            connection: bellmqConnection,
            skipVersionCheck: true,
            concurrency: 5,
        }
    );

expertiseWorker.on(
    "completed",
    (job) => {
        logger.info(`Expertise job completed: ${job.id}`, { context: "ExpertiseWorker", metadata: { jobId: job.id } });
    }
);

expertiseWorker.on(
    "failed",
    (job, error) => {
        logger.error(
            `Expertise job failed: ${job?.id}`,
            error instanceof Error ? error : { context: "ExpertiseWorker", metadata: { jobId: job?.id, error: String(error) } }
        );
    }
);

expertiseWorker.on(
    "error",
    (error) => {
        logger.error(
            "Expertise worker error",
            error instanceof Error ? error : { context: "ExpertiseWorker", metadata: { error: String(error) } }
        );
    }
);
