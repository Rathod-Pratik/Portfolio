import type { Request, Response } from "express";
import { AboutModel } from "./About.model.ts";
import { getCache, setCache, getCacheVersion, AboutCacheKeys } from "@utils";
import { addAboutCacheJob } from "./About.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";


export const getAbout = async (
  req: Request,
  res: Response
) => {
  try {
    const version = await getCacheVersion(
      AboutCacheKeys.detailsVersion('about')
    );

    const cacheKey =
      `${AboutCacheKeys.details('about', version)}`;

    const cachedAbout =
      await getCache(cacheKey);

    if (cachedAbout) {
      return res.status(200).json({
        data: cachedAbout,
        'source': 'cache',
      });
    }

    const about =
      await AboutModel.findOne().lean();

    if (!about) {
      return res.status(404).json({
        message: "About information not found",
      });
    }

    await setCache(
      cacheKey,
      about,
      600
    );

    return res.status(200).json({
      data: about,
      'source': 'database',
    });
  } catch (error) {
    console.error(
      "Get About error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateAbout = async (
  req: Request,
  res: Response
) => {
  try {
    const { content } = req.body;

    await addAboutCacheJob({
      content: content,
    });

    await sendInfoNotification(
      "About Updated",
      "About information was updated successfully."
    );
    return res.status(200).json({
      message: "About updated successfully",
    });
  } catch (error) {
    console.error(
      "Update About error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};