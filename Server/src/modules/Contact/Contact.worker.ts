import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { setCache } from "@utils";
import { contactModel } from "./contact.model.ts";
import {
    ContactCacheKeys,
} from "@utils";
import type { IContactCacheJob } from "./Contact.queue.ts";

export const contactWorker = new Worker<IContactCacheJob>(
    "contact",
    async (job) => {
        const { version, page, limit } = job.data;

        const skip = (page - 1) * limit;

        const contacts = await contactModel
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const cacheKey = ContactCacheKeys.list(
            version,
            page,
            limit
        );

        await setCache(
            cacheKey,
            contacts,
            600
        );

        return {
            cacheKey,
            count: contacts.length,
        };
    },
    {
        connection: bellmqConnection,
        concurrency: 1,
    }
);

contactWorker.on("completed", (job) => {
    console.log(
        `Contact cache job completed: ${job.id}`
    );
});

contactWorker.on("failed", (job, error) => {
    console.error(
        `Contact cache job failed: ${job?.id}`,
        error
    );
});

contactWorker.on("error", (error) => {
    console.error(
        "Contact worker error:",
        error
    );
});