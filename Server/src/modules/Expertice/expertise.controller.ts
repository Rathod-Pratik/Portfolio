import type { Request, Response } from "express";
import { ExpertiseModel } from "./expertise.model.ts";
import {
    Get_Signed_Url,
    uploadFileToS3,
    getCache,
    setCache,
    getCacheVersion,
    incrementCacheVersion,
    ExpertiseCacheKeys,
    uploadWithRetry,
    getUploadedFile,
    logger,
} from "@utils";

import {
    addCreateExpertiseJob,
    addUpdateExpertiseJob,
} from "./Expertise.queue.ts";

import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";

import type { IExpertice } from "./Expertise.types.ts";
import { CreateExpertiseSchema, ExpertiseIdSchema, UpdateExpertiseSchema } from "./Expertise.validation.ts";
import { ImageFileSchema } from "@utils";

export const createExpertise = async (
    req: Request,
    res: Response
) => {
    try {
        const validate = CreateExpertiseSchema.safeParse(req.body);

        if (!validate.success) {
            await logger.warn("Create expertise validation failed", {
                context: "ExpertiseController",
                metadata: { errors: validate.error.issues },
            });
            return res.status(400).json({
                message: validate.error.issues,
            });
        }
        const {
            title,
            description,
        } = validate.data;

        const file = getUploadedFile(req);

        const validateFile = ImageFileSchema.safeParse(file);

        if (!validateFile.success) {
            await logger.warn("Create expertise image validation failed", {
                context: "ExpertiseController",
                metadata: { errors: validateFile.error.issues },
            });
            return res.status(400).json({
                message: validateFile.error.issues,
            });
        }

        const uploadedFile =
            await uploadWithRetry(
                validateFile.data as Express.Multer.File,
                3,
                "Expertise"
            );

        const data: IExpertice = {
            title,
            description,
            image: uploadedFile.key,
        };

        const job = await addCreateExpertiseJob(data);

        await sendInfoNotification(
            "Expertise Creation",
            `Expertise "${title}" was added to the creation queue and is being processed.`
        );

        await logger.info(`Expertise creation queued: ${title}`, {
            context: "ExpertiseController",
            metadata: { jobId: job.id, title },
        });

        return res.status(202).json({
            message: `Expertise "${title}" was added to the creation queue and is being processed.`,
            jobId: job.id,
        });
    } catch (error) {
        await logger.error(
            "Create expertise error",
            error instanceof Error ? error : { context: "ExpertiseController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getExpertise = async (
    req: Request,
    res: Response
) => {
    try {
        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 10;

        const version =
            await getCacheVersion(
                ExpertiseCacheKeys.listVersion()
            );

        const cacheKey =
            ExpertiseCacheKeys.list(
                version,
                page,
                limit
            );

        const cachedExpertise =
            await getCache(cacheKey);

        if (cachedExpertise) {
            await logger.debug("Fetched expertise list from cache", { context: "ExpertiseController" });
            return res.status(200).json({
                data: cachedExpertise,
                source: "cache",
            });
        }

        const skip =
            (page - 1) * limit;

        const expertise =
            await ExpertiseModel.find({ isDeleted: false })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean();

        const signedExpertise =
            await Promise.all(
                expertise.map(async (item) => ({
                    ...item,
                    image: item.image
                        ? await Get_Signed_Url({ key: item.image })
                        : null,
                }))
            );

        await setCache(
            cacheKey,
            signedExpertise
        );

        await logger.info(`Fetched ${expertise.length} expertise from database`, { context: "ExpertiseController" });

        return res.status(200).json(
            {
                data: signedExpertise,
                source: "database",
            }
        );
    } catch (error) {
        await logger.error(
            "Get expertise error",
            error instanceof Error ? error : { context: "ExpertiseController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getExpertiseById = async (
    req: Request,
    res: Response
) => {
    try {
        const validateId = ExpertiseIdSchema.safeParse(req.params);

        if (!validateId.success) {
            await logger.warn("Get expertise by ID validation failed", {
                context: "ExpertiseController",
                metadata: { errors: validateId.error.issues },
            });
            return res.status(400).json({
                message: validateId.error.issues,
            });
        }
        const { id } = validateId.data;

        const version =
            await getCacheVersion(
                ExpertiseCacheKeys.detailsVersion(
                    id
                )
            );

        const cacheKey =
            ExpertiseCacheKeys.details(
                id,
                version
            );

        const cachedExpertise =
            await getCache(cacheKey);

        if (cachedExpertise) {
            await logger.debug(`Fetched expertise from cache for ID: ${id}`, { context: "ExpertiseController" });
            return res.status(200).json(
                { data: cachedExpertise, source: "cache" }
            );
        }

        const expertise =
            await ExpertiseModel
                .findOne({ _id: id, isDeleted: false })
                .lean();

        if (!expertise) {
            await logger.warn(`Expertise not found with ID: ${id}`, { context: "ExpertiseController" });
            return res.status(404).json({
                message: "Expertise not found",
            });
        }

        if (expertise.image) {
            const signedImageUrl =
                await Get_Signed_Url({ key: expertise.image });
            expertise.image = signedImageUrl;
        }

        await setCache(
            cacheKey,
            expertise
        );

        await logger.info(`Fetched expertise from database for ID: ${id}`, { context: "ExpertiseController" });

        return res.status(200).json(
            { data: expertise, source: "database" }
        );
    } catch (error) {
        await logger.error(
            "Get expertise by ID error",
            error instanceof Error ? error : { context: "ExpertiseController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const updateExpertise = async (
    req: Request,
    res: Response
) => {
    try {
        const validateBody = UpdateExpertiseSchema.safeParse(req.body);

        if (!validateBody.success) {
            await logger.warn("Update expertise validation failed", {
                context: "ExpertiseController",
                metadata: { errors: validateBody.error.issues },
            });
            return res.status(400).json({
                message: validateBody.error.issues,
            });
        }
        const {
            title,
            description,
        } = validateBody.data;

        const validateId = ExpertiseIdSchema.safeParse(req.params);

        if (!validateId.success) {
            await logger.warn("Update expertise invalid ID param", {
                context: "ExpertiseController",
                metadata: { errors: validateId.error.issues },
            });
            return res.status(400).json({
                message: validateId.error.issues,
            });
        }
        const { id } = validateId.data;

        const Expertise =
            await ExpertiseModel.findOne({ _id: id, isDeleted: false });

        if (!Expertise) {
            await logger.warn(`Update expertise: Not found for ID: ${id}`, { context: "ExpertiseController" });
            return res.status(404).json({
                message: "Expertise not found",
            });
        }

        const file = getUploadedFile(req);
        let image;

        if (file) {
            const validateFile = ImageFileSchema.safeParse(file);

            if (!validateFile.success) {
                await logger.warn("Update expertise invalid image file", {
                    context: "ExpertiseController",
                    metadata: { errors: validateFile.error.issues },
                });
                return res.status(400).json({
                    message: validateFile.error.issues,
                });
            }

            const uploadedFile = await uploadWithRetry(validateFile.data as Express.Multer.File, 3, "Expertise");
            image = uploadedFile.key;
        }

        const job =
            await addUpdateExpertiseJob(
                id,
                {
                    title: title ? title : Expertise.title,
                    description: description ? description : Expertise.description,
                    image: image ? image : Expertise.image,
                }
            );

        await sendInfoNotification(
            "Expertise Update",
            `Expertise "${Expertise.title}" was added to the update queue and is being processed.`
        );

        await logger.info(`Expertise update queued for ID: ${id}`, {
            context: "ExpertiseController",
            metadata: { jobId: job.id, expertiseId: id },
        });

        return res.status(202).json({
            message: `Expertise "${Expertise.title}" was added to the update queue and is being processed.`,
            jobId: job.id,
        });
    } catch (error) {
        await logger.error(
            "Update expertise error",
            error instanceof Error ? error : { context: "ExpertiseController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const deleteExpertise = async (
    req: Request,
    res: Response
) => {
    try {
        const validateId = ExpertiseIdSchema.safeParse(req.params);
        if (!validateId.success) {
            await logger.warn("Delete expertise invalid ID param", {
                context: "ExpertiseController",
                metadata: { errors: validateId.error.issues },
            });
            return res.status(400).json({
                message: validateId.error.issues,
            });
        }
        const { id } = validateId.data;

        const expertise =
            await ExpertiseModel.findOne({ _id: id, isDeleted: false });

        if (!expertise) {
            await logger.warn(`Delete expertise: Not found for ID: ${id}`, { context: "ExpertiseController" });
            return res.status(404).json({
                message: "Expertise not found",
            });
        }

        const deletedExpertise = await ExpertiseModel.findByIdAndUpdate({ _id: id }, { isDeleted: true });

        if (!deletedExpertise) {
            await logger.warn(`Delete expertise: Failed to mark deleted for ID: ${id}`, { context: "ExpertiseController" });
            return res.status(404).json({
                message: "Expertise not found",
            });
        }

        await incrementCacheVersion(
            ExpertiseCacheKeys.listVersion()
        );

        await incrementCacheVersion(
            ExpertiseCacheKeys.detailsVersion(id)
        );

        await sendInfoNotification(
            "Expertise Deleted",
            `Expertise "${expertise.title}" was deleted successfully.`
        );

        await logger.info(`Expertise deleted for ID: ${id}`, { context: "ExpertiseController" });

        return res.status(200).json({
            message:
                "Expertise deleted successfully",
        });
    } catch (error) {
        await logger.error(
            "Delete expertise error",
            error instanceof Error ? error : { context: "ExpertiseController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
