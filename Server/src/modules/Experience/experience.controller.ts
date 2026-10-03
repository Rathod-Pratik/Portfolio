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
    logger,
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
            await logger.warn("Create experience validation failed", {
                context: "ExperienceController",
                metadata: { errors: validate.error.issues },
            });
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

        const job = await addCreateExperienceJob(data);

        await sendInfoNotification(
            "Experience Creation",
            `Experience "${title}" was added to the creation queue and is being processed.`
        );

        await logger.info(`Experience creation queued: ${title}`, {
            context: "ExperienceController",
            metadata: { jobId: job.id, title, company },
        });

        return res.status(202).json({
            message: `Experience "${title}" was added to the creation queue and is being processed.`,
        });
    } catch (error) {
        await logger.error(
            "Create experience error",
            error instanceof Error ? error : { context: "ExperienceController", metadata: { error: String(error) } }
        );
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
            await logger.debug("Fetched experiences from cache", { context: "ExperienceController" });
            return res.status(200).json({
                data: cachedExperiences,
                source: "cache",
            });
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

        await logger.info(`Fetched ${experiences.length} experiences from database`, { context: "ExperienceController" });

        return res.status(200).json({
            data: experiences,
            source: "database",
        });
    } catch (error) {
        await logger.error(
            "Get experiences error",
            error instanceof Error ? error : { context: "ExperienceController", metadata: { error: String(error) } }
        );
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
            await logger.warn("Get experience by ID validation failed", {
                context: "ExperienceController",
                metadata: { errors: validate.error.issues },
            });
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
            await logger.debug(`Fetched experience from cache for ID: ${id}`, { context: "ExperienceController" });
            return res.status(200).json({
                data: cachedExperience,
                source: "cache"
            });
        }

        const experience =
            await ExperienceModel.findOne({ _id: id, isDeleted: false }).lean();

        if (!experience) {
            await logger.warn(`Experience not found with ID: ${id}`, { context: "ExperienceController" });
            return res.status(404).json({
                message: "Experience not found",
            });
        }

        await setCache(
            cacheKey,
            experience
        );

        await logger.info(`Fetched experience from database for ID: ${id}`, { context: "ExperienceController" });

        return res.status(200).json({
            data: experience,
            source: "database"
        });
    } catch (error) {
        await logger.error(
            "Get experience by ID error",
            error instanceof Error ? error : { context: "ExperienceController", metadata: { error: String(error) } }
        );
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
            await logger.warn("Update experience validation failed", {
                context: "ExperienceController",
                metadata: { errors: validate.error.issues },
            });
            return res.status(400).json({
                message: validate.error.issues,
            });
        }
        const ValidateId = ExperienceIdSchema.safeParse(req.params);
        if (!ValidateId.success) {
            await logger.warn("Update experience invalid ID param", {
                context: "ExperienceController",
                metadata: { errors: ValidateId.error.issues },
            });
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
            await logger.warn(`Update experience: Not found for ID: ${id}`, { context: "ExperienceController" });
            return res.status(404).json({
                message: "Experience not found",
            });
        }

        const job = await addUpdateExperienceJob(
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
            `Experience "${title || existingExperience.title}" was added to the update queue and is being processed.`
        );

        await logger.info(`Experience update queued for ID: ${id}`, {
            context: "ExperienceController",
            metadata: { jobId: job.id, experienceId: id },
        });

        return res.status(202).json({
            message: `Experience "${title || existingExperience.title}" was added to the update queue and is being processed.`,
        });
    } catch (error) {
        await logger.error(
            "Update experience error",
            error instanceof Error ? error : { context: "ExperienceController", metadata: { error: String(error) } }
        );
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
            await logger.warn("Delete experience invalid ID param", {
                context: "ExperienceController",
                metadata: { errors: validate.error.issues },
            });
            return res.status(400).json({
                message: validate.error.issues,
            });
        }
        const { id } = validate.data;

        const experience =
            await ExperienceModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

        if (!experience) {
            await logger.warn(`Delete experience: Not found for ID: ${id}`, { context: "ExperienceController" });
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

        await logger.info(`Experience deleted for ID: ${id}`, { context: "ExperienceController" });

        return res.status(200).json({
            message: "Experience deleted successfully",
        });
    } catch (error) {
        await logger.error(
            "Delete experience error",
            error instanceof Error ? error : { context: "ExperienceController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};