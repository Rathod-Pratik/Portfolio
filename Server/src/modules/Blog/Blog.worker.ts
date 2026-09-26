import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import {
    BlogCacheKeys,
    incrementCacheVersion,
} from "@utils";
import { blogModel } from "./Blog.model.ts";
import type {
    IBlogCacheJob,
} from "./Blog.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.index.ts";

export const blogWorker = new Worker<IBlogCacheJob>(
    "blog",
    async (job) => {
        const {
            title,
            slug,
            excerpt,
            content,
            tags,
            image,
            isPublished,
            _id
        } = job.data;

        if (_id) {
            const blog =
                await blogModel.findByIdAndUpdate(
                    _id,
                    {
                        title,
                        slug,
                        excerpt,
                        content,
                        image,
                        tags,
                        isPublished,
                    },
                    { new: true }
                );
        } else {
            const blog =
                await blogModel.create({
                    title,
                    slug,
                    excerpt,
                    content,
                    image,
                    tags,
                    isPublished:
                        isPublished ?? false,
                });
        }

        await incrementCacheVersion(
            BlogCacheKeys.listVersion()
        );
        if (_id) {

            await incrementCacheVersion(
                BlogCacheKeys.detailsVersion(_id)
            );
        }

        await sendInfoNotification(
            "Blog Created",
            `Blog "${title}" was created successfully.`
        );
    },
    {
        connection: bellmqConnection,
        concurrency: 1,
    }
);

blogWorker.on("completed", (job) => {
    console.log(
        `Blog cache job completed: ${job.id}`
    );
});

blogWorker.on("failed", (job, error) => {
    console.error(
        `Blog cache job failed: ${job?.id}`,
        error
    );
});

blogWorker.on("error", (error) => {
    console.error(
        "Blog worker error:",
        error
    );
});