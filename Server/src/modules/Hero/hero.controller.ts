import type { Request, Response } from "express";
import { HeroModel } from "./Hero.model.ts";
import {
    getCache,
    setCache,
    getCacheVersion,
    HeroCacheKeys,
    HERO_ID,
    getUploadedFile,
    Get_Signed_Url,
    uploadWithRetry,
    ImageFileSchema
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
            return res.status(200).json({
                data: cachedHero,
                source: "cache",
            });
        }

        const hero =
            await HeroModel.findOne().lean();

        if (!hero) {
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

        return res.status(200).json({
            data: hero,
            source: "database",
        });
    } catch (error) {
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

        const file = getUploadedFile(req);
        const validateFile = ImageFileSchema.safeParse(file);

        if (!validateFile.success) {
            return res.status(400).json({
                message: validateFile.error.issues,
            });
        }

        const hero = await HeroModel.findOne().lean();

        if (!hero) {
            return res.status(404).json({
                message: "Hero not found",
            });
        }

        let image;
        if (file) {
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

        return res.status(202).json({
            message:
                "Hero section was added to the update queue and is being processed.",
            jobId: job.id,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};