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
import { CreateExperienceSchema, UpdateExperienceSchema, ExperienceIdSchema } from "./Experience.validation.ts";

export const createExperience = async (
    req: Request,
    res: Response
) => {
    try {
        const validate = CreateExperienceSchema.safeParse(req.body);

        if (!validate.success) {
            return res.status(400).json({
                message: validate.error.issues,
            });
        }

        const {
            year,
            duration,
            title,
            company,
            description,
        } = validate.data;

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
        });
    }
};

export const getExperiences = async (
    req: Request,
    res: Response
) => {
    try {
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 10;

        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 100) limit = 100;

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
            return res.status(200).json({
                data: cachedExperiences,
                source: "cache",
            }
            );
        }

        const skip = (page - 1) * limit;

        const experiences =
            await ExperienceModel.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

        await setCache(
            cacheKey,
            experiences
        );

        return res.status(200).json({
            data: experiences,
            source: "database",
        }
        );
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getExperienceById = async (
    req: Request,
    res: Response
) => {
    try {
        const validate = ExperienceIdSchema.safeParse(req.params);
        if (!validate.success) {
            return res.status(400).json({
                message: validate.error.issues,
            });
        }
        const { id } = validate.data;

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
            return res.status(200).json({
                data: cachedExperience,
                source: "cache"
            });
        }

        const experience =
            await ExperienceModel.findOne({ _id: id, isDeleted: false }).lean();

        if (!experience) {
            return res.status(404).json({
                message: "Experience not found",
            });
        }

        await setCache(
            cacheKey,
            experience
        );

        return res.status(200).json({
            data: experience,
            source: "database"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const updateExperience = async (
    req: Request,
    res: Response
) => {
    try {
        const validate = UpdateExperienceSchema.safeParse(req.body);

        if (!validate.success) {
            return res.status(400).json({
                message: validate.error.issues,
            });
        }
        const ValidateId = ExperienceIdSchema.safeParse(req.params);
        if (!ValidateId.success) {
            return res.status(400).json({
                message: ValidateId.error.issues,
            });
        }
        const { id } = ValidateId.data;

        const {
            year,
            duration,
            title,
            company,
            description,
        } = validate.data;

        const existingExperience =
            await ExperienceModel.findOne({ _id: id, isDeleted: false }).lean();

        if (!existingExperience) {
            return res.status(404).json({
                message: "Experience not found",
            });
        }

        await addUpdateExperienceJob(
            id,
            {
                year: year ? year : existingExperience.year,
                duration: duration ? duration : existingExperience.duration,
                title: title ? title : existingExperience.title,
                company: company ? company : existingExperience.company,
                description: description ? description : existingExperience.description,
            }
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
            message: "Internal server error"
        });
    }
};

export const deleteExperience = async (
    req: Request,
    res: Response
) => {
    try {
        const validate = ExperienceIdSchema.safeParse(req.params);
        if (!validate.success) {
            return res.status(400).json({
                message: validate.error.issues,
            });
        }
        const { id } = validate.data;

        const experience =
            await ExperienceModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

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
            message: "Internal server error"
        });
    }
};