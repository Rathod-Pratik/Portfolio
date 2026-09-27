import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";

export const BLOG_QUEUE_NAME = "blog";

export interface IBlogCacheJob {
    _id?: string;
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    image?: string;
    tags?: string[];
    isPublished?: boolean;
    isDeleted?: boolean;
}

export const blogQueue = new Queue<IBlogCacheJob>(
    BLOG_QUEUE_NAME,
    {
        connection: bellmqConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000,
            },
            removeOnComplete: 100,
            removeOnFail: 100,
        },
    }
);

export const CreateBlogJob = async (item: IBlogCacheJob) => {
    return await blogQueue.add(
        "create-blog",
        item
    );
};