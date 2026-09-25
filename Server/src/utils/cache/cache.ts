import { redis } from "@config/redis.ts";

export const getCache = async <T>(
    key: string
): Promise<T | null> => {
    try {
        const data = await redis.get(key);

        if (!data) {
            return null;
        }

        return JSON.parse(data) as T;

    } catch (error) {
        console.error(`Redis GET error [${key}]:`, error);

        return null;
    }
};

export const setCache = async <T>(
    key: string,
    data: T,
    ttl: number = 600
): Promise<void> => {
    try {

        await redis.set(
            key,
            JSON.stringify(data),
            {
                EX: ttl,
            }
        );

    } catch (error) {
        console.error(`Redis SET error [${key}]:`, error);
    }
};

export const deleteCache = async (
    key: string
): Promise<void> => {
    try {

        await redis.del(key);

    } catch (error) {
        console.error(`Redis DELETE error [${key}]:`, error);
    }
};

export const deleteCaches = async (
    keys: string[]
): Promise<void> => {

    if (keys.length === 0) {
        return;
    }

    try {

        await redis.del(keys);

    } catch (error) {
        console.error(
            "Redis DELETE MULTIPLE error:",
            error
        );
    }
};

export const cacheExists = async (
    key: string
): Promise<boolean> => {
    try {

        const exists = await redis.exists(key);

        return exists === 1;

    } catch (error) {
        console.error(
            `Redis EXISTS error [${key}]:`,
            error
        );

        return false;
    }
};