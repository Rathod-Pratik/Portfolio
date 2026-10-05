import type { Request, Response } from "express";
import { HeroModel } from "./hero.model.ts";
import {
    getCache,
    setCache,
    getCacheVersion,
    HeroCacheKeys,
    HERO_ID,
    getUploadedFile,
    Get_Signed_Url,
    uploadWithRetry,
    ImageFileSchema,
    logger,
} from "@utils";
import { addUpdateHeroJob } from "./Hero.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";
import { UpdateHeroSchema } from "./Hero.validation.ts";

export const getHero = async (
    req: Request,
    res: Response
) => {
    try {
        const version =
            await getCacheVersion(
                HeroCacheKeys.detailsVersion(HERO_ID)
            );

        const cacheKey =
            HeroCacheKeys.details(
                HERO_ID,
                version
            );

        const cachedHero =
            await getCache(cacheKey);

        if (cachedHero) {
            await logger.debug("Fetched Hero from cache", { context: "HeroController" });
            return res.status(200).json({
                data: cachedHero,
                source: "cache",
            });
        }

        const hero =
            await HeroModel.findOne().lean();

        if (!hero) {
            await logger.warn("Hero not found in database", { context: "HeroController" });
            return res.status(404).json({
                message: "Hero not found",
            });
        }

        if (hero.image) {
            hero.image = await Get_Signed_Url({
                key: hero.image,
            });
        }

        await setCache(
            cacheKey,
            hero,
            60 * 60 * 24
        );

        await logger.info("Fetched Hero from database", { context: "HeroController" });

        return res.status(200).json({
            data: hero,
            source: "database",
        });
    } catch (error) {
        await logger.error(
            "Get Hero error",
            error instanceof Error ? error : { context: "HeroController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const updateHero = async (
    req: Request,
    res: Response
) => {
    try {
        const validate = UpdateHeroSchema.safeParse(req.body);
        if (!validate.success) {
            await logger.warn("Update hero validation failed", {
                context: "HeroController",
                metadata: { errors: validate.error.issues },
            });
            return res.status(400).json({
                message: validate.error.issues,
            });
        }
        const {
            greeting,
            name,
            roles,
            description,
        } = validate.data;

        const hero = await HeroModel.findOne().lean();

        if (!hero) {
            await logger.warn("Update hero: Hero not found", { context: "HeroController" });
            return res.status(404).json({
                message: "Hero not found",
            });
        }

        const file = getUploadedFile(req);
        let image;

        if (file) {
            const validateFile = ImageFileSchema.safeParse(file);

            if (!validateFile.success) {
                await logger.warn("Update hero image validation failed", {
                    context: "HeroController",
                    metadata: { errors: validateFile.error.issues },
                });
                return res.status(400).json({
                    message: validateFile.error.issues,
                });
            }

            const uploadedFile =
                await uploadWithRetry(validateFile.data as Express.Multer.File, 3, "Hero");

            image = uploadedFile.key;
        }

        const job =
            await addUpdateHeroJob({
                greeting: greeting ? greeting : hero.greeting,
                name: name ? name : hero.name,
                roles: roles ? roles : hero.roles,
                description: description ? description : hero.description,
                image: image ? image : hero.image,
            });

        await sendInfoNotification(
            "Hero Update",
            "Hero section was added to the update queue and is being processed."
        );

        await logger.info("Hero update queued successfully", {
            context: "HeroController",
            metadata: { jobId: job.id, name },
        });

        return res.status(202).json({
            message:
                "Hero section was added to the update queue and is being processed.",
            jobId: job.id,
        });
    } catch (error) {
        await logger.error(
            "Update Hero error",
            error instanceof Error ? error : { context: "HeroController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
