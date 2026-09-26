import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { ProjectCacheKeys, incrementCacheVersion } from "@utils";
import { Project } from "./Project.model.ts";
import type { IProjectJob } from "./Project.types.ts";



export const projectWorker = new Worker<IProjectJob>(
    "project",
    async (job) => {
        switch (job.data.type) {
            case "create": {
                await Project.create(job.data.data);

                await incrementCacheVersion(
                    ProjectCacheKeys.listVersion()
                );

                return;
            }

            case "update": {
                await Project.findByIdAndUpdate(
                    job.data.projectId,
                    job.data.data,
                    {
                        new: true,
                    }
                );

                await incrementCacheVersion(
                    ProjectCacheKeys.listVersion()
                );

                await incrementCacheVersion(
                    ProjectCacheKeys.detailsVersion(job.data.projectId)
                );

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
    console.log(`Project job completed: ${job.id}`);
});

projectWorker.on("failed", (job, error) => {
    console.error(
        `Project job failed: ${job?.id}`,
        error
    );
});