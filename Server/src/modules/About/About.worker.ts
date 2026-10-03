import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { AboutCacheKeys, incrementCacheVersion, logger } from "@utils";

import type { IAboutCacheJob } from "./About.types.ts";
import { AboutModel } from "./About.model.ts";

export const aboutWorker = new Worker<IAboutCacheJob>(
    "about",
    async (job) => {
        const { content } = job.data;

        let about =
            await AboutModel.findOne();

        if (!about) {
            about = await AboutModel.create({
                content,
            });
        } else {
            about.content = content;

            await about.save();
        }
        await incrementCacheVersion(
            AboutCacheKeys.detailsVersion('about')
        );

        await logger.info(
            `About cache and database updated for ID: ${about._id.toString()}`,
            { context: "AboutWorker", metadata: { aboutId: about._id.toString(), jobId: job.id } }
        );
    },
    {
        connection: bellmqConnection,
        concurrency: 1,
    }
);

aboutWorker.on("completed", (job) => {
    logger.info(`About job completed: ${job.id}`, { context: "AboutWorker", metadata: { jobId: job.id } });
});

aboutWorker.on("failed", (job, error) => {
    logger.error(
        `About job failed: ${job?.id}`,
        error instanceof Error ? error : { context: "AboutWorker", metadata: { jobId: job?.id, error: String(error) } }
    );
});

aboutWorker.on("error", (error) => {
    logger.error(
        "About worker error",
        error instanceof Error ? error : { context: "AboutWorker", metadata: { error: String(error) } }
    );
});