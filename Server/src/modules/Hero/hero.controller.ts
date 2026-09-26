import type { Request, Response } from "express";
import { HeroModel } from "./Hero.model.ts";
import {
    uploadFileToS3,
    getCache,
    setCache,
    getCacheVersion,
    HeroCacheKeys,
    HERO_ID,
    getUploadedFile,
    Get_Signed_Url,
} from "@utils";
import { addUpdateHeroJob } from "./Hero.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";
import type { IHero } from "./Hero.types.ts";

const signHeroImage = async <T extends { image?: string }>(
    hero: T
) => {
    if (
        hero.image &&
        !hero.image.startsWith("http")
    ) {
        const signedUrl = await Get_Signed_Url({
            key: hero.image,
        });

        if (signedUrl) {
            return {
                ...hero,
                image: signedUrl,
            };
        }
    }

    return hero;
};

export const getHero = async (
    _req: Request,
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

        const signedHero =
            await signHeroImage(hero);

        await setCache(
            cacheKey,
            signedHero,
            60 * 60 * 24
        );

        return res.status(200).json({
            data: signedHero,
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
        const {
            greeting,
            name,
            roles,
            description,
        } = req.body;

        const updateData: Partial<IHero> = {};

        if (greeting !== undefined) {
            updateData.greeting = greeting;
        }

        if (name !== undefined) {
            updateData.name = name;
        }

        if (roles !== undefined) {
            updateData.roles = roles;
        }

        if (description !== undefined) {
            updateData.description =
                description;
        }

        const file = getUploadedFile(req);

        if (file) {
            const uploadedFile =
                await uploadFileToS3({
                    buffer: file.buffer,
                    fileName: file.originalname,
                    fileType: file.mimetype,
                    folderType: "Hero",
                });

            updateData.image =
                uploadedFile.key;
        }

        const job =
            await addUpdateHeroJob(updateData);

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