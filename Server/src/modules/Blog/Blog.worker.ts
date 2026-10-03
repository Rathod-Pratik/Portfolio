import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import {
    BlogCacheKeys,
    incrementCacheVersion,
    logger,
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
                await logger.warn(`Blog worker update failed: Blog not found for ID: ${_id}`, { context: "BlogWorker" });
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

            await logger.info(`Blog updated in database for ID: ${_id}`, {
                context: "BlogWorker",
                metadata: { blogId: _id, jobId: job.id },
            });

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

        await logger.info(`Blog created in database for ID: ${blog._id.toString()}`, {
            context: "BlogWorker",
            metadata: { blogId: blog._id.toString(), jobId: job.id },
        });
    },
    {
        connection: bellmqConnection,
        concurrency: 1,
    }
);

blogWorker.on("completed", (job) => {
    logger.info(`Blog cache job completed: ${job.id}`, { context: "BlogWorker", metadata: { jobId: job.id } });
});

blogWorker.on("failed", (job, error) => {
    logger.error(
        `Blog cache job failed: ${job?.id}`,
        error instanceof Error ? error : { context: "BlogWorker", metadata: { jobId: job?.id, error: String(error) } }
    );
});

blogWorker.on("error", (error) => {
    logger.error(
        "Blog worker error",
        error instanceof Error ? error : { context: "BlogWorker", metadata: { error: String(error) } }
    );
});