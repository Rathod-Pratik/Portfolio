import type { Request, Response } from "express";
import { ExperienceModel } from "./Experience.model.ts";
import type {
    IExperience,
} from "./Experience.types.ts";
import {
    getCache,
    setCache,
    getCacheVersion,
    incrementCacheVersion,
    ExperienceCacheKeys,
} from "@utils";
import {
    addCreateExperienceJob,
    addUpdateExperienceJob,
} from "./Experience.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";

const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

export const createExperience = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            year,
            duration,
            title,
            company,
            description,
        } = req.body;

        const data: IExperience = {
            year,
            duration,
            title,
            company,
            description,
        };

        await addCreateExperienceJob(data);

        await sendInfoNotification(
            "Experience Creation",
            `Experience "${title}" was added to the creation queue and is being processed.`
        );

        return res.status(202).json({
            message: `Experience "${title}" was added to the creation queue and is being processed.`,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: toErrorMessage(error),
        });
    }
};

export const getExperiences = async (
    req: Request,
    res: Response
) => {
    try {
        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.max(
            Number(req.query.limit) || 10,
            1
        );

        const version =
            await getCacheVersion(
                ExperienceCacheKeys.listVersion()
            );

        const cacheKey =
            ExperienceCacheKeys.list(
                version,
                page,
                limit
            );

        const cachedExperiences =
            await getCache(cacheKey);

        if (cachedExperiences) {
            return res.status(200).json(
                cachedExperiences
            );
        }

        const skip = (page - 1) * limit;

        const experiences =
            await ExperienceModel.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

        await setCache(
            cacheKey,
            experiences
        );

        return res.status(200).json(
            experiences
        );
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: toErrorMessage(error),
        });
    }
};

export const getExperienceById = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        const version =
            await getCacheVersion(
                ExperienceCacheKeys.detailsVersion(id as string)
            );

        const cacheKey =
            ExperienceCacheKeys.details(
                  id as string,
                version
            );

        const cachedExperience =
            await getCache(cacheKey);

        if (cachedExperience) {
            return res.status(200).json(
                cachedExperience
            );
        }

        const experience =
            await ExperienceModel.findById(id).lean();

        if (!experience) {
            return res.status(404).json({
                message: "Experience not found",
            });
        }

        await setCache(
            cacheKey,
            experience
        );

        return res.status(200).json(
            experience
        );
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: toErrorMessage(error),
        });
    }
};

export const updateExperience = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        const {
            year,
            duration,
            title,
            company,
            description,
        } = req.body;

        const existingExperience =
            await ExperienceModel.findById(id).lean();

        if (!existingExperience) {
            return res.status(404).json({
                message: "Experience not found",
            });
        }

        const data: IExperience = {
            year,
            duration,
            title,
            company,
            description,
        };

        await addUpdateExperienceJob(
            id as string,
            data
        );

        await sendInfoNotification(
            "Experience Update",
            `Experience "${title}" was added to the update queue and is being processed.`
        );

        return res.status(202).json({
            message: `Experience "${title}" was added to the update queue and is being processed.`,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: toErrorMessage(error),
        });
    }
};

export const deleteExperience = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        const experience =
            await ExperienceModel.findByIdAndDelete(id);

        if (!experience) {
            return res.status(404).json({
                message: "Experience not found",
            });
        }

        await incrementCacheVersion(
            ExperienceCacheKeys.listVersion()
        );

        await incrementCacheVersion(
            ExperienceCacheKeys.detailsVersion(id as string)
        );

        await sendInfoNotification(
            "Experience Deleted",
            `Experience "${experience.title}" was deleted successfully.`
        );

        return res.status(200).json({
            message: "Experience deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: toErrorMessage(error),
        });
    }
};