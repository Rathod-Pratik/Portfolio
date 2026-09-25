import { redis } from "@config/redis.ts";

export const getCacheVersion = async (
    key: string
): Promise<number> => {

    try {

        const version = await redis.get(key);

        if (!version) {
            await redis.set(key, "1");

            return 1;
        }

        return Number(version);

    } catch (error) {

        console.error(
            `Redis VERSION GET error [${key}]:`,
            error
        );

        return 1;
    }
};

export const incrementCacheVersion = async (
    key: string
): Promise<number> => {

    try {

        return await redis.incr(key);

    } catch (error) {

        console.error(
            `Redis VERSION INCREMENT error [${key}]:`,
            error
        );

        return 1;
    }
};