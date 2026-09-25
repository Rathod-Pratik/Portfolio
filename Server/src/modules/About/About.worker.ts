import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { setCache, getCacheVersion, AboutCacheKeys } from "@utils";

import type { IAboutCacheJob } from "./About.types.ts";

export const aboutWorker = new Worker<IAboutCacheJob>(
    "about",
    async (job) => {
        const { aboutId, content } = job.data;

        const version = await getCacheVersion(
            AboutCacheKeys.listVersion()
        );

        const cacheKey =
            `${AboutCacheKeys.list(version, 1, 10)}`;

        await setCache(
            cacheKey,
            {
                _id: aboutId,
                content,
            },
            600
        );

        console.log(
            `About cache updated: ${cacheKey}`
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