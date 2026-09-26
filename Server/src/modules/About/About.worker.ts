import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { AboutCacheKeys, incrementCacheVersion } from "@utils";

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


        console.log(
            `About cache updated for ID: ${about._id.toString()}`
        );
    },
    {
        connection: bellmqConnection,
        concurrency: 1,
    }
);

aboutWorker.on("completed", (job) => {
    console.log(
        `About job completed: ${job.id}`
    );
});

aboutWorker.on("failed", (job, error) => {
    console.error(
        `About job failed: ${job?.id}`,
        error
    );
});

aboutWorker.on("error", (error) => {
    console.error(
        "About worker error:",
        error
    );
});