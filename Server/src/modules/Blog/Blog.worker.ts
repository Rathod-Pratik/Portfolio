import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import {
    getCacheVersion,
    setCache,
    Get_Signed_Url,
    BlogCacheKeys,
} from "@utils";
import blogModel from "./blog.model.ts";
import type {
    IBlogCacheJob,
} from "./Blog.queue.ts";

const signBlogCoverImage = async <T extends {
    coverImage?: string;
}>(
    blog: T
) => {
    if (
        blog.coverImage &&
        typeof blog.coverImage === "string" &&
        !blog.coverImage.startsWith("http")
    ) {
        try {
            const signedUrl = await Get_Signed_Url({
                key: blog.coverImage,
            });

            return {
                ...blog,
                coverImage: signedUrl,
            };
        } catch (error) {
            console.error(
                "Failed to sign blog cover image:",
                error
            );
        }
    }

    return blog;
};

export const blogWorker = new Worker<IBlogCacheJob>(
    "blog",
    async (job) => {
        if (job.data.type === "list") {
            const {
                version,
                page = 1,
                limit = 10,
            } = job.data;

            const skip = (page - 1) * limit;

            const blogs = await blogModel
                .find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const signedBlogs = await Promise.all(
                blogs.map((blog) =>
                    signBlogCoverImage(blog)
                )
            );

            const cacheKey =
                BlogCacheKeys.list(
                    version,
                    page,
                    limit
                );

            await setCache(
                cacheKey,
                signedBlogs,
                600
            );

            return {
                cacheKey,
                count: signedBlogs.length,
            };
        }

        if (job.data.type === "item") {
            const {
                blogId,
                version,
            } = job.data;

            if (!blogId) {
                throw new Error(
                    "Blog ID is required"
                );
            }

            const blog =
                await blogModel
                    .findById(blogId)
                    .lean();

            if (!blog) {
                return {
                    cacheKey: BlogCacheKeys.details(
                        blogId,
                        version
                    ),
                    cached: false,
                };
            }

            const signedBlog =
                await signBlogCoverImage(blog);

            const cacheKey =
                BlogCacheKeys.details(
                    blogId,
                    version
                );

            await setCache(
                cacheKey,
                signedBlog,
                600
            );

            return {
                cacheKey,
                cached: true,
            };
        }

        throw new Error(
            "Invalid blog cache job type"
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