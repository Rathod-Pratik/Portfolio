import type { Request, Response } from "express";
import { AboutModel } from "./About.model.ts";
import { getCache, incrementCacheVersion, getCacheVersion, AboutCacheKeys } from "@utils";
import { addAboutCacheJob } from "./About.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.service.ts";


export const getAbout = async (
  req: Request,
  res: Response
) => {
  try {
    const version = await getCacheVersion(
      AboutCacheKeys.listVersion()
    );

    const cacheKey =
      `${AboutCacheKeys.list(version, 1, 10)}`;

    const cachedAbout =
      await getCache(cacheKey);

    if (cachedAbout) {
      return res.status(200).json(
        cachedAbout
      );
    }

    const about =
      await AboutModel.findOne().lean();

    if (!about) {
      return res.status(404).json({
        message: "About information not found",
      });
    }

    await addAboutCacheJob({
      id: about._id.toString(),
      content: about.content,
    });

    return res.status(200).json(about);
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

    let about =
      await AboutModel.findOne();

    if (!about) {
      about = await AboutModel.create({
        content,
      });
    } else {
      about.content = content;

      await about.save();
    }

    await incrementCacheVersion(
      AboutCacheKeys.listVersion()
    );

    await addAboutCacheJob({
      id: about._id.toString(),
      content: about.content,
    });

    await sendInfoNotification(
      "About Updated",
      "About information was updated successfully."
    );
    return res.status(200).json({
      message: "About updated successfully",
      about,
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