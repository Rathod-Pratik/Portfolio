import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ResumeCacheKeys, incrementCacheVersion } from "@utils";
import { CVmodel } from "./Resume.model.ts";
import type { IResumeJob } from "./Resume.types.ts";


export const resumeWorker = new Worker<IResumeJob>(
    "resume",
    async (job) => {
        switch (job.data.type) {
            case "create": {
                await CVmodel.create(job.data.data);

                await incrementCacheVersion(
                    ResumeCacheKeys.listVersion()
                );

                return;
            }

            case "update": {
                const updatedResume =
                    await CVmodel.findByIdAndUpdate(
                        job.data.resumeId,
                        job.data.data,
                        {
                            new: true,
                        }
                    );

                if (!updatedResume) {
                    throw new Error("Resume not found");
                }

                await incrementCacheVersion(
                    ResumeCacheKeys.listVersion()
                );

                await incrementCacheVersion(
                    ResumeCacheKeys.detailsVersion(
                        job.data.resumeId
                    )
                );

                return;
            }

            default:
                throw new Error("Unknown Resume job type");
        }
    },
    {
        connection: bellmqConnection,
    }
);

resumeWorker.on("completed", (job) => {
    console.log(`Resume job completed: ${job.id}`);
});

resumeWorker.on("failed", (job, error) => {
    console.error(
        `Resume job failed: ${job?.id}`,
        error
    );
});