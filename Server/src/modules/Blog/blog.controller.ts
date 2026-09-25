import blogModel from "./blog.model.ts";
import {
  Get_Signed_Url,
  uploadFileToS3,
  getUploadedFile,
  getCache,
  getCacheVersion,
  incrementCacheVersion,
  BlogCacheKeys
} from "@utils";
import type { Request, Response } from "express";
import {
  addBlogListCacheJob,
  addBlogItemCacheJob,
} from "./Blog.queue.ts";

import {
  sendInfoNotification,
  sendDangerNotification,
} from "@modules/Notification/Notification.service.ts";

const toErrorMessage = (
  error: unknown
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const signBlogCoverImage = async <
  T extends { coverImage?: string }
>(
  blog: T
) => {
  if (
    blog.coverImage &&
    typeof blog.coverImage === "string" &&
    !blog.coverImage.startsWith("http")
  ) {
    try {
      const signedUrl =
        await Get_Signed_Url({
          key: blog.coverImage,
        });

      return {
        ...blog,
        coverImage: signedUrl,
      };
    } catch (error) {
      console.error(
        "Failed to sign blog cover image:",
        error
      );
    }
  }

  return blog;
};

export const createBlog = async (
  req: Request,
  res: Response
) => {
  try {
    const {
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

    const blog =
      await blogModel.create({
        title,
        slug,
        excerpt,
        content,
        coverImage:
          uploadedFile.key,
        tags: tags || [],
        isPublished:
          isPublished ?? false,
      });

    const version =
      await incrementCacheVersion(
        BlogCacheKeys.listVersion()
      );

    await addBlogListCacheJob(
      version,
      1,
      10
    );

    await sendInfoNotification(
      "Blog Created",
      `Blog "${title}" was created successfully.`
    );

    return res.status(201).json({
      message:
        "Blog created successfully",
      blog,
    });
  } catch (error) {
    await sendDangerNotification(
      "Blog Creation Failed",
      "Failed to create blog."
    );

    return res.status(500).json({
      message: "Error creating blog",
      error: toErrorMessage(error),
    });
  }
};

export const getBlogs = async (
  req: Request,
  res: Response
) => {
  try {
    const page =
      Math.max(
        Number(req.query.page) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          Number(req.query.limit) || 10,
          1
        ),
        100
      );

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

    const signedBlogs =
      await Promise.all(
        blogs.map((blog) =>
          signBlogCoverImage(blog)
        )
      );

    await addBlogListCacheJob(
      version,
      page,
      limit
    );

    return res.status(200).json({
      blog: signedBlogs,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Error fetching blogs",
      error: toErrorMessage(error),
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

    const signedBlog =
      await signBlogCoverImage(blog);

    await addBlogItemCacheJob(
      id,
      version
    );

    return res.status(200).json(
      signedBlog
    );
  } catch (error) {
    return res.status(500).json({
      message:
        "Error fetching blog",
      error: toErrorMessage(error),
    });
  }
};

export const updateBlog = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } =
      req.params as {
        id: string;
      };

    const file =
      getUploadedFile(req);

    const updateData = {
      ...req.body,
    };

    const oldBlog =
      await blogModel.findById(id);

    if (!oldBlog) {
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

      updateData.coverImage =
        uploadedFile.key;
    }

    const updatedBlog =
      await blogModel.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedBlog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    const listVersion =
      await incrementCacheVersion(
        BlogCacheKeys.listVersion()
      );

    const itemVersion =
      await incrementCacheVersion(
        BlogCacheKeys.detailsVersion(id)
      );

    await addBlogListCacheJob(
      listVersion,
      1,
      10
    );

    await addBlogItemCacheJob(
      id,
      itemVersion
    );

    await sendInfoNotification(
      "Blog Updated",
      `Blog "${updatedBlog.title}" was updated successfully.`
    );

    const signedBlog =
      await signBlogCoverImage(
        updatedBlog.toObject()
      );

    return res.status(200).json({
      message:
        "Blog updated successfully",
      updatedBlog: signedBlog,
    });
  } catch (error) {
    await sendDangerNotification(
      "Blog Update Failed",
      "Failed to update blog."
    );

    return res.status(500).json({
      message:
        "Error updating blog",
      error: toErrorMessage(error),
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

    const listVersion =
      await incrementCacheVersion(
        BlogCacheKeys.listVersion()
      );

    await incrementCacheVersion(
      BlogCacheKeys.detailsVersion(id)
    );

    await addBlogListCacheJob(
      listVersion,
      1,
      10
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
        "Error deleting blog",
      error: toErrorMessage(error),
    });
  }
};