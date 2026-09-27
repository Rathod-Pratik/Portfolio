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
import {
    sendInfoNotification,
} from "@modules/Notification/Notification.index.ts";

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
            _id,
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
                    {
                        new: true,
                    }
                );

            if (!blog) {
                throw new Error("Blog not found");
            }

            await incrementCacheVersion(
                BlogCacheKeys.listVersion()
            );

            await incrementCacheVersion(
                BlogCacheKeys.detailsVersion(_id)
            );

            await sendInfoNotification(
                "Blog Updated",
                `Blog "${blog.title}" was updated successfully.`
            );

            return;
        }

        const blog = await blogModel.create({
            title,
            slug,
            excerpt,
            content,
            image,
            tags,
            isPublished: isPublished ?? false,
        });

        await incrementCacheVersion(
            BlogCacheKeys.listVersion()
        );

        await sendInfoNotification(
            "Blog Created",
            `Blog "${blog.title}" was created successfully.`
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