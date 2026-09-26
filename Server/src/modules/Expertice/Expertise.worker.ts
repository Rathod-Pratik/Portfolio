import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ExpertiseModel } from "./Expertise.model.ts";
import {
    incrementCacheVersion,
    ExpertiseCacheKeys,
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

            return expertise;
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
            `Expertise job completed: ${job.id}`
        );
    }
);

expertiseWorker.on(
    "failed",
    (job, error) => {
        console.error(
            `Expertise job failed: ${job?.id}`,
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