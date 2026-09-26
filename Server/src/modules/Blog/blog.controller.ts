import {blogModel} from "./Blog.model.ts";
import {
  Get_Signed_Url,
  uploadFileToS3,
  getUploadedFile,
  getCache,
  getCacheVersion,
  incrementCacheVersion,
  BlogCacheKeys,
  setCache
} from "@utils";
import type { Request, Response } from "express";
import { CreateBlogJob } from "./Blog.queue.ts";

import {
  sendInfoNotification,
  sendDangerNotification,
} from "@modules/Notification/Notification.service.ts";
import type { IBlog } from "./Blog.types.ts";

export const createBlog = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      _id,
      title,
      slug,
      excerpt,
      content,
      tags,
      isPublished,
    } = req.body;

    const file =
      getUploadedFile(req);

    if (!file) {
      return res.status(400).json({
        message:
          "Cover image file is required",
      });
    }

    const uploadedFile =
      await uploadFileToS3({
        buffer: file.buffer,
        fileName: file.originalname,
        fileType: file.mimetype,
        folderType: "Blog",
      });




    await CreateBlogJob({
      _id,
      title,
      slug,
      excerpt,
      content,
      image: uploadedFile.key,
      tags,
      isPublished,
    });


    await sendInfoNotification(
      "Blog Creation",
      `Blog "${title}" was added to the creation queue and is being processed.`,
    );

    return res.status(201).json({
      message:
        `Blog "${title}" was added to the creation queue and is being processed.`
    });
  } catch (error) {
    await sendDangerNotification(
      "Blog Creation Failed",
      "Failed to create blog."
    );
  }
};

export const getBlogs = async (
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
        BlogCacheKeys.listVersion()
      );

    const cacheKey =
      BlogCacheKeys.list(
        version,
        page,
        limit
      );

    const cachedBlogs =
      await getCache(cacheKey);

    if (cachedBlogs) {
      return res.status(200).json({
        blog: cachedBlogs,
        'source': 'cache',
      });
    }

    const skip =
      (page - 1) * limit;

    const blogs =
      await blogModel
        .find()
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    const signedBlogs = await Promise.all(
      blogs.map(async (blog: IBlog) => ({
        ...blog,
        image: blog.image
          ? await Get_Signed_Url({
            key: blog.image,
          })
          : null,
      })),
    );
    await setCache(
      cacheKey,
      signedBlogs,
      600
    );
    
    return res.status(200).json({
      blog: signedBlogs,
      'source': 'database',
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Error fetching blogs",
    });
  }
};

export const getBlogBySlug = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } =
      req.params as {
        id: string;
      };

    const version =
      await getCacheVersion(
        BlogCacheKeys.detailsVersion(id)
      );

    const cacheKey =
      BlogCacheKeys.details(
        id,
        version
      );

    const cachedBlog =
      await getCache(cacheKey);

    if (cachedBlog) {
      return res.status(200).json(
        cachedBlog
      );
    }

    const blog =
      await blogModel
        .findOne({
          _id: id,
        })
        .lean();

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    if (blog.image) {
      blog.image = await Get_Signed_Url({
        key: blog.image,
      });
    }

    setCache(
      cacheKey,
      blog,
      600
    );
    return res.status(200).json(
      blog
    );
  } catch (error) {
    return res.status(500).json({
      message:
        "Error fetching blog",
    });
  }
};

export const updateBlog = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params as { id: string };
    const { title, slug, excerpt, content, tags, isPublished } = req.body;

    const file =
      getUploadedFile(req);

    const updateData = {
      ...req.body,
    };

    const blog =
      await blogModel.findById(id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    if (file) {
      const uploadedFile =
        await uploadFileToS3({
          buffer: file.buffer,
          fileName:
            file.originalname,
          fileType:
            file.mimetype,
          folderType: "Blog",
        });

      updateData.image =
        uploadedFile.key;
    }

    await CreateBlogJob({
      _id: id,
      title,
      slug,
      excerpt,
      content,
      image: updateData.image,
      tags,
      isPublished,
    });

    await sendInfoNotification(
      "Blog Update",
      `Blog "${title}" was added to the update queue and is being processed.`,
    );

    return res.status(200).json({
      message:
        "Blog updated under processing",
      
    });
  } catch (error) {
    await sendDangerNotification(
      "Blog Update Failed",
      "Failed to update blog."
    );

    return res.status(500).json({
      message:
        "Error updating blog"
    });
  }
};

export const deleteBlog = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } =
      req.params as {
        id: string;
      };

    const blog =
      await blogModel.findById(id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    const deletedBlog =
      await blogModel.findByIdAndDelete(
        id
      );
      if (!deletedBlog) {
        return res.status(404).json({
          message: "Blog not found",
        });
      }

      await incrementCacheVersion(
        BlogCacheKeys.listVersion()
      );

    await incrementCacheVersion(
      BlogCacheKeys.detailsVersion(id)
    );

    await sendInfoNotification(
      "Blog Deleted",
      `Blog "${deletedBlog.title}" was deleted successfully.`
    );

    return res.status(200).json({
      message:
        "Blog deleted successfully",
    });
  } catch (error) {
    await sendDangerNotification(
      "Blog Deletion Failed",
      "Failed to delete blog."
    );

    return res.status(500).json({
      message:
        "Error deleting blog"
    });
  }
};