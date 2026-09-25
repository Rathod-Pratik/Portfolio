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
} from "@utils";
import {
  addExpertiseListCacheJob,
  addExpertiseDetailsCacheJob,
} from "./Expertise.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";

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

const signImage = async <T extends { image?: string }>(
  expertise: T
) => {
  if (
    expertise.image &&
    typeof expertise.image === "string" &&
    !expertise.image.startsWith("http")
  ) {
    try {
      const signedUrl = await Get_Signed_Url({
        key: expertise.image,
      });

      if (signedUrl) {
        return {
          ...expertise,
          image: signedUrl,
        };
      }
    } catch (error) {
      console.error(
        "Failed to sign expertise image:",
        error
      );
    }
  }

  return expertise;
};

export const createExpertise = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      title,
      description,
      linkTo,
    } = req.body;

    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({
        message: "Image file is required",
      });
    }

    const uploadedFile =
      await uploadFileToS3({
        buffer: file.buffer,
        fileName: file.originalname,
        fileType: file.mimetype,
        folderType: "Expertise",
      });

    const expertise =
      await ExpertiseModel.create({
        title,
        description,
        image: uploadedFile.key,
        linkTo: linkTo || "#",
      });

    const version =
      await incrementCacheVersion(
        ExpertiseCacheKeys.listVersion()
      );

    await addExpertiseListCacheJob(
      version,
      1,
      10
    );

    await sendInfoNotification(
      "Expertise Created",
      `Expertise "${title}" was created successfully.`
    );

    return res.status(201).json({
      message: "Expertise created successfully",
      expertise,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: toErrorMessage(error),
    });
  }
};

export const getExpertise = async (
  req: Request,
  res: Response
) => {
  try {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

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
      return res.status(200).json(
        cachedExpertise
      );
    }

    const skip =
      (page - 1) * limit;

    const expertise =
      await ExpertiseModel.find()
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const signedExpertise =
      await Promise.all(
        expertise.map((item) =>
          signImage(item)
        )
      );

    await setCache(
      cacheKey,
      signedExpertise
    );

    return res.status(200).json(
      signedExpertise
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: toErrorMessage(error),
    });
  }
};

export const getExpertiseById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } =
      req.params as { id: string };

    const version =
      await getCacheVersion(
        ExpertiseCacheKeys.detailsVersion(id)
      );

    const cacheKey =
      ExpertiseCacheKeys.details(
        id,
        version
      );

    const cachedExpertise =
      await getCache(cacheKey);

    if (cachedExpertise) {
      return res.status(200).json(
        cachedExpertise
      );
    }

    const expertise =
      await ExpertiseModel
        .findById(id)
        .lean();

    if (!expertise) {
      return res.status(404).json({
        message: "Expertise not found",
      });
    }

    const signedExpertise =
      await signImage(expertise);

    await setCache(
      cacheKey,
      signedExpertise
    );

    return res.status(200).json(
      signedExpertise
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: toErrorMessage(error),
    });
  }
};

export const updateExpertise = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } =
      req.params as { id: string };

    const {
      title,
      description,
      linkTo,
    } = req.body;

    const file = getUploadedFile(req);

    const oldExpertise =
      await ExpertiseModel.findById(id);

    if (!oldExpertise) {
      return res.status(404).json({
        message: "Expertise not found",
      });
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (description !== undefined) {
      updateData.description =
        description;
    }

    if (linkTo !== undefined) {
      updateData.linkTo = linkTo;
    }

    if (file) {
      const uploadedFile =
        await uploadFileToS3({
          buffer: file.buffer,
          fileName: file.originalname,
          fileType: file.mimetype,
          folderType: "Expertise",
        });

      updateData.image =
        uploadedFile.key;
    }

    const expertise =
      await ExpertiseModel.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!expertise) {
      return res.status(404).json({
        message: "Expertise not found",
      });
    }

    const listVersion =
      await incrementCacheVersion(
        ExpertiseCacheKeys.listVersion()
      );

    const detailsVersion =
      await incrementCacheVersion(
        ExpertiseCacheKeys.detailsVersion(id)
      );

    await addExpertiseListCacheJob(
      listVersion,
      1,
      10
    );

    await addExpertiseDetailsCacheJob(
      id,
      detailsVersion
    );

    await sendInfoNotification(
      "Expertise Updated",
      `Expertise "${expertise.title}" was updated successfully.`
    );

    return res.status(200).json({
      message: "Expertise updated successfully",
      expertise,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: toErrorMessage(error),
    });
  }
};

export const deleteExpertise = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } =
      req.params as { id: string };

    const expertise =
      await ExpertiseModel.findById(id);

    if (!expertise) {
      return res.status(404).json({
        message: "Expertise not found",
      });
    }

    await ExpertiseModel.findByIdAndDelete(id);

    const listVersion =
      await incrementCacheVersion(
        ExpertiseCacheKeys.listVersion()
      );

    await incrementCacheVersion(
      ExpertiseCacheKeys.detailsVersion(id)
    );

    await addExpertiseListCacheJob(
      listVersion,
      1,
      10
    );

    await sendInfoNotification(
      "Expertise Deleted",
      `Expertise "${expertise.title}" was deleted successfully.`
    );

    return res.status(200).json({
      message: "Expertise deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: toErrorMessage(error),
    });
  }
};