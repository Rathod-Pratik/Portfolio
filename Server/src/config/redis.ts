import { createClient } from "redis";
import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = createClient({
    url: redisUrl,
});

redis.on("error", (error) => {
    console.error("Redis client error:", error);
});

export const connectRedis = async () => {
    if (redis.isOpen) {
        return;
    }

    await redis.connect();

    console.log("Redis connected");
};

export const bellmqConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});