import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ProjectCacheKeys, incrementCacheVersion, logger } from "@utils";
import { Project } from "./Project.model.ts";
import type { IProjectJob } from "./Project.types.ts";

export const projectWorker = new Worker<IProjectJob>(
    "project",
    async (job) => {
        switch (job.data.type) {
            case "create": {
                const project = await Project.create(job.data.data);

                await incrementCacheVersion(
                    ProjectCacheKeys.listVersion()
                );

                await logger.info(`Project created in DB: ${project.title}`, {
                    context: "ProjectWorker",
                    metadata: { projectId: project._id.toString(), jobId: job.id },
                });

                return;
            }

            case "update": {
                const project = await Project.findByIdAndUpdate(
                    job.data.projectId,
                    job.data.data,
                    {
                        new: true,
                    }
                );

                if (!project) {
                    await logger.warn(`Project worker update failed: ID not found: ${job.data.projectId}`, { context: "ProjectWorker" });
                    throw new Error("Project not found");
                }

                await incrementCacheVersion(
                    ProjectCacheKeys.listVersion()
                );

                await incrementCacheVersion(
                    ProjectCacheKeys.detailsVersion(job.data.projectId)
                );

                await logger.info(`Project updated in DB for ID: ${job.data.projectId}`, {
                    context: "ProjectWorker",
                    metadata: { projectId: job.data.projectId, jobId: job.id },
                });

                return;
            }

            default:
                throw new Error("Unknown Project job type");
        }
    },
    {
        connection: bellmqConnection,
    }
);

projectWorker.on("completed", (job) => {
    logger.info(`Project job completed: ${job.id}`, { context: "ProjectWorker", metadata: { jobId: job.id } });
});

projectWorker.on("failed", (job, error) => {
    logger.error(
        `Project job failed: ${job?.id}`,
        error instanceof Error ? error : { context: "ProjectWorker", metadata: { jobId: job?.id, error: String(error) } }
    );
});
