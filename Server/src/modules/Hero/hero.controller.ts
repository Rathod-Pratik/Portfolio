import type { Request, Response } from "express";
import { HeroModel } from "./hero.model.ts";
import {
  Get_Signed_Url,
  uploadFileToS3,
  getCache,
  setCache,
  getCacheVersion,
  incrementCacheVersion,
  HeroCacheKeys,
  HERO_ID,
} from "@utils";
import { addHeroCacheJob } from "./Hero.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";
import type { UpdateHeroRequestBody } from "@type";

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const getUploadedFile = (req: Request) => {
  const files = req.files as
    | {
      file?: Express.Multer.File[];
      image?: Express.Multer.File[];
    }
    | undefined;

  return (
    files?.image?.[0] ??
    files?.file?.[0] ??
    req.file ??
    null
  );
};

const signHeroImage = async <
  T extends { image?: string }
>(
  hero: T
) => {
  if (
    hero.image &&
    typeof hero.image === "string" &&
    !hero.image.startsWith("http")
  ) {
    try {
      const signedUrl =
        await Get_Signed_Url({
          key: hero.image,
        });

      if (signedUrl) {
        return {
          ...hero,
          image: signedUrl,
        };
      }
    } catch (error) {
      console.error(
        "Failed to get signed URL for hero image:",
        error
      );
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
        HeroCacheKeys.detailsVersion(
          HERO_ID
        )
      );

    const cacheKey =
      HeroCacheKeys.details(
        HERO_ID,
        version
      );

    const cachedHero =
      await getCache(cacheKey);

    if (cachedHero) {
      return res.status(200).json(
        cachedHero
      );
    }

    let hero =
      await HeroModel.findOne();

    if (!hero) {
      hero = new HeroModel();
      await hero.save();
    }

    const heroObj = hero.toObject();

    const signedHero =
      await signHeroImage(heroObj);

    await setCache(
      cacheKey,
      signedHero
    );

    return res.status(200).json(
      signedHero
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: toErrorMessage(error),
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

    const file =
      getUploadedFile(req);

    const updateData: Record<
      string,
      unknown
    > = {};

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

    let hero =
      await HeroModel.findOne();

    if (!hero) {
      hero = new HeroModel(
        updateData
      );

      await hero.save();
    } else {
      Object.assign(
        hero,
        updateData
      );

      await hero.save();
    }

    const version =
      await incrementCacheVersion(
        HeroCacheKeys.detailsVersion(
          HERO_ID
        )
      );

    await addHeroCacheJob(
      version
    );

    await sendInfoNotification(
      "Hero Updated",
      "Hero section was updated successfully."
    );

    return res.status(200).json({
      message: "Hero updated successfully",
      hero,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: toErrorMessage(error),
    });
  }
};