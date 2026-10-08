import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { logger } from "@utils";
import { CVmodel } from "./Resume.model.ts";
import type { IResumeJob } from "./Resume.types.ts";

export const resumeWorker = new Worker<IResumeJob>(
    "resume",
    async (job) => {
        switch (job.data.type) {
            case "create": {
                const cv = await CVmodel.create(job.data.data);

                await logger.info(`CV created in DB with ID: ${cv._id.toString()}`, {
                    context: "ResumeWorker",
                    metadata: { cvId: cv._id.toString(), jobId: job.id },
                });

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
                    await logger.warn(`Resume worker update failed: ID not found: ${job.data.resumeId}`, { context: "ResumeWorker" });
                    throw new Error("Resume not found");
                }

                await logger.info(`CV updated in DB for ID: ${job.data.resumeId}`, {
                    context: "ResumeWorker",
                    metadata: { cvId: job.data.resumeId, jobId: job.id },
                });

                return;
            }

            default:
                throw new Error("Unknown Resume job type");
        }
    },
    {
        connection: bellmqConnection,
        skipVersionCheck: true,
    }
);

resumeWorker.on("completed", (job) => {
    logger.info(`Resume job completed: ${job.id}`, { context: "ResumeWorker", metadata: { jobId: job.id } });
});

resumeWorker.on("failed", (job, error) => {
    logger.error(
        `Resume job failed: ${job?.id}`,
        error instanceof Error ? error : { context: "ResumeWorker", metadata: { jobId: job?.id, error: String(error) } }
    );
});
