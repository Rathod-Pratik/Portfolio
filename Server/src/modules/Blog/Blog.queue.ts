import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";

export const BLOG_QUEUE_NAME = "blog";

export interface IBlogCacheJob {
    type: "list" | "item";
    version: number;
    page?: number;
    limit?: number;
    blogId?: string;
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

export const addBlogListCacheJob = async (
    version: number,
    page: number,
    limit: number
) => {
    return await blogQueue.add(
        "cache-blog-list",
        {
            type: "list",
            version,
            page,
            limit,
        }
    );
};

export const addBlogItemCacheJob = async (
    blogId: string,
    version: number
) => {
    return await blogQueue.add(
        "cache-blog-item",
        {
            type: "item",
            version,
            blogId,
        }
    );
};