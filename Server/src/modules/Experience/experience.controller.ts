import type { Request, Response } from "express";
import { ExperienceModel } from "./experience.model.ts";
import type {
  CreateExperienceRequestBody,
  ExperienceIdParams,
  UpdateExperienceRequestBody,
} from "@type";
import {
  getCache,
  setCache,
  getCacheVersion,
  incrementCacheVersion,
  ExperienceCacheKeys,
} from "@utils";
import {
  addExperienceListCacheJob,
  addExperienceDetailsCacheJob,
} from "./Experience.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const createExperience = async (
  req: Request<
    Record<string, never>,
    unknown,
    CreateExperienceRequestBody
  >,
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

    const experience =
      await ExperienceModel.create({
        year,
        duration,
        title,
        company,
        description,
      });

    const version =
      await incrementCacheVersion(
        ExperienceCacheKeys.listVersion()
      );

    await addExperienceListCacheJob(
      version,
      1,
      10
    );

    await sendInfoNotification(
      "Experience Created",
      `Experience "${title}" was created successfully.`
    );

    return res.status(201).json({
      message: "Experience created successfully",
      experience,
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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

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
  req: Request<ExperienceIdParams>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const version =
      await getCacheVersion(
        ExperienceCacheKeys.detailsVersion(id)
      );

    const cacheKey =
      ExperienceCacheKeys.details(
        id,
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
  req: Request<
    ExperienceIdParams,
    unknown,
    UpdateExperienceRequestBody
  >,
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

    const experience =
      await ExperienceModel.findByIdAndUpdate(
        id,
        {
          year,
          duration,
          title,
          company,
          description,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!experience) {
      return res.status(404).json({
        message: "Experience not found",
      });
    }

    const listVersion =
      await incrementCacheVersion(
        ExperienceCacheKeys.listVersion()
      );

    const detailsVersion =
      await incrementCacheVersion(
        ExperienceCacheKeys.detailsVersion(id)
      );

    await addExperienceListCacheJob(
      listVersion,
      1,
      10
    );

    await addExperienceDetailsCacheJob(
      id,
      detailsVersion
    );

    await sendInfoNotification(
      "Experience Updated",
      `Experience "${title}" was updated successfully.`
    );

    return res.status(200).json({
      message: "Experience updated successfully",
      experience,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: toErrorMessage(error),
    });
  }
};

export const deleteExperience = async (
  req: Request<ExperienceIdParams>,
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

    const listVersion =
      await incrementCacheVersion(
        ExperienceCacheKeys.listVersion()
      );

    await incrementCacheVersion(
      ExperienceCacheKeys.detailsVersion(id)
    );

    await addExperienceListCacheJob(
      listVersion,
      1,
      10
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