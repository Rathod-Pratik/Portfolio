import { blogModel } from "./Blog.model.ts";
import {
  Get_Signed_Url,
  getUploadedFile,
  getCache,
  getCacheVersion,
  incrementCacheVersion,
  BlogCacheKeys,
  setCache,
  uploadWithRetry,
  ImageFileSchema
} from "@utils";
import type { Request, Response } from "express";
import { CreateBlogJob } from "./Blog.queue.ts";

import {
  sendInfoNotification,
  sendDangerNotification,
} from "@modules/Notification/Notification.service.ts";
import type { IBlog } from "./Blog.types.ts";
import { BlogIdSchema, CreateBlogSchema, UpdateBlogSchema } from "./Blog.validation.ts";

export const createBlog = async (
  req: Request,
  res: Response
) => {
  try {
    const validate = CreateBlogSchema.safeParse(req.body);
    if (!validate.success) {
      return res.status(400).json({
        message: "Invalid request body",
        error: validate.error.issues,
      });
    }

    const {
      title,
      slug,
      excerpt,
      content,
      tags,
      isPublished,
    } = validate.data;

    const file = getUploadedFile(req);

    const fileValidate = ImageFileSchema.safeParse(file);

    if (!fileValidate.success) {
      return res.status(400).json({
        message: "Invalid image file",
        error: fileValidate.error.issues,
      });
    }

    const uploadedFile =
      await uploadWithRetry(
        fileValidate.data as Express.Multer.File,
        3,
        "Blog",
      );

    const blogData: IBlog = {
      title,
      slug,
      excerpt,
      content,
      image: uploadedFile.key,
      tags,
      author: "Admin",
      isPublished,
      isDeleted: false,
    };

    await CreateBlogJob(blogData);


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

    const blogs =
      await blogModel
        .find({ isDeleted: false })
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
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
      return res.status(200).json({
        data: cachedBlog,
        source: "cache",
      });
    }

    const blog =
      await blogModel
        .findOne({
          _id: id,
          isDeleted: false,
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
    return res.status(200).json({
      data: blog,
      source: "database",
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Error fetching blog",
    });
  }
};

export const updateBlog = async (
  req: Request,
  res: Response,
) => {
  try {
    const validateParams = BlogIdSchema.safeParse(req.params);

    if (!validateParams.success) {
      return res.status(400).json({
        message: validateParams.error.issues,
      });
    }

    const { id } = validateParams.data;

    const validateBody = UpdateBlogSchema.safeParse(req.body);

    if (!validateBody.success) {
      return res.status(400).json({
        message: validateBody.error.issues,
      });
    }

    const {
      title,
      slug,
      excerpt,
      content,
      tags,
      isPublished,
    } = validateBody.data;

    const file = getUploadedFile(req);
    const fileValidate = ImageFileSchema.safeParse(file);

    if (!fileValidate.success) {
      return res.status(400).json({
        message: fileValidate.error.issues,
      });
    }

    const blog = await blogModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    let image;

    if (file) {
      const uploadedFile = await uploadWithRetry(
        fileValidate.data as Express.Multer.File,
        3,
        "Blog",
      );

      image = uploadedFile.key;
    }

    await CreateBlogJob({
      _id: id,
      title: title ? title : blog.title,
      slug: slug ? slug : blog.slug,
      excerpt: excerpt ? excerpt : blog.excerpt,
      content: content ? content : blog.content,
      image: image ? image : blog.image,
      tags: tags ? tags : blog.tags,
      isPublished: isPublished ? isPublished : blog.isPublished,
    });

    await sendInfoNotification(
      "Blog Update",
      `Blog "${title}" was added to the update queue and is being processed.`,
    );

    return res.status(202).json({
      message: "Blog update added to processing queue",
    });
  } catch (error) {
    await sendDangerNotification(
      "Blog Update Failed",
      "Failed to update blog.",
    );

    return res.status(500).json({
      message: "Error updating blog",
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

    const validate = BlogIdSchema.safeParse(req.params);
    if (!validate.success) {
      return res.status(400).json({
        message: validate.error.issues,
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