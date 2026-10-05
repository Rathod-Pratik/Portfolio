import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Blog.model.ts", () => ({
  blogModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.unstable_mockModule("./Blog.queue.ts", () => ({
  CreateBlogJob: jest.fn(),
}));

jest.unstable_mockModule("@modules/Notification/Notification.service.ts", () => ({
  sendInfoNotification: jest.fn(),
  sendDangerNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  Get_Signed_Url: jest.fn(),
  getUploadedFile: jest.fn(),
  getCache: jest.fn(),
  getCacheVersion: jest.fn(),
  incrementCacheVersion: jest.fn(),
  setCache: jest.fn(),
  uploadWithRetry: jest.fn(),
  ImageFileSchema: {
    safeParse: jest.fn((file) => {
      if (!file) return { success: true, data: undefined };
      return { success: true, data: file };
    }),
  },
  BlogCacheKeys: {
    listVersion: jest.fn(() => "version:blog:list"),
    list: jest.fn((v: number, p: number, l: number) => `blog:list:${v}:${p}:${l}`),
    detailsVersion: jest.fn((id: string) => `version:blog:${id}`),
    details: jest.fn((id: string, v: number) => `blog:${id}:${v}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const {
  createBlog,
  getBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} = await import("./blog.controller.ts");

const { blogModel } = await import("./blog.model.ts");
const { CreateBlogJob } = await import("./Blog.queue.ts");
const {
  Get_Signed_Url,
  getUploadedFile,
  getCache,
  getCacheVersion,
  incrementCacheVersion,
  setCache,
  uploadWithRetry,
  ImageFileSchema,
} = await import("@utils");
const {
  sendInfoNotification,
  sendDangerNotification,
} = await import("@modules/Notification/Notification.service.ts");

describe("Blog Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBlog", () => {
    it("should return 400 if validation fails", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await createBlog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid request body" })
      );
    });

    it("should return 400 if image file is missing or invalid", async () => {
      const req = createMockRequest({
        body: {
          title: "My Tech Blog",
          slug: "my-tech-blog",
          excerpt: "Short excerpt text for blog",
          content: "Full markdown content goes here",
          tags: ["tech", "ai"],
          isPublished: true,
        },
      });
      const res = createMockResponse();

      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: false,
        error: { issues: [{ message: "Invalid image" }] },
      } as any);

      await createBlog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid image file" })
      );
    });

    it("should upload file, queue creation job and return 201 on success", async () => {
      const req = createMockRequest({
        body: {
          title: "My Tech Blog",
          slug: "my-tech-blog",
          excerpt: "Short excerpt text for blog",
          content: "Full markdown content goes here",
          tags: ["tech", "ai"],
          isPublished: true,
        },
      });
      const res = createMockResponse();

      const mockFile = { buffer: Buffer.from("abc"), originalname: "img.jpg", mimetype: "image/jpeg" };
      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: mockFile,
      } as any);
      jest.mocked(uploadWithRetry).mockResolvedValue({ key: "blog/img.jpg" } as any);
      jest.mocked(CreateBlogJob).mockResolvedValue({ id: "job-blog-1" } as any);

      await createBlog(req, res as any);

      expect(uploadWithRetry).toHaveBeenCalled();
      expect(CreateBlogJob).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My Tech Blog",
          image: "blog/img.jpg",
          author: "Admin",
        })
      );
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 500 when error occurs", async () => {
      const req = createMockRequest({
        body: {
          title: "My Tech Blog",
          slug: "my-tech-blog",
          excerpt: "Short excerpt text for blog",
          content: "Full markdown content goes here",
          tags: ["tech"],
          isPublished: true,
        },
      });
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue({ originalname: "img.jpg" } as any);
      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: { originalname: "img.jpg" },
      } as any);
      jest.mocked(uploadWithRetry).mockRejectedValue(new Error("S3 error") as never);

      await createBlog(req, res as any);

      expect(sendDangerNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getBlogs", () => {
    it("should return cached blogs if present", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue([{ title: "Cached blog" }] as never);

      await getBlogs(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        blog: [{ title: "Cached blog" }],
        source: "cache",
      });
    });

    it("should query database and generate signed URLs on cache miss", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);

      const mockBlogs = [
        { _id: "1", title: "Blog 1", image: "key-1" },
        { _id: "2", title: "Blog 2", image: null },
      ];

      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockBlogs as never),
      };
      jest.mocked(blogModel.find).mockReturnValue(chain as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://s3/signed-url" as never);

      await getBlogs(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        blog: expect.any(Array),
        source: "database",
      });
    });

    it("should return 500 on database error", async () => {
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockRejectedValue(new Error("DB Error") as never);

      await getBlogs(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getBlogBySlug", () => {
    it("should return cached blog if available", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue({ title: "Cached" } as never);

      await getBlogBySlug(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { title: "Cached" },
        source: "cache",
      });
    });

    it("should return 404 if blog is not found in db", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(blogModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      await getBlogBySlug(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Blog not found" });
    });

    it("should sign image and cache result on cache miss", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      const mockBlog = { _id: "507f1f77bcf86cd799439011", title: "Test", image: "key.jpg" };
      jest.mocked(blogModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockBlog as never),
      } as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed.url" as never);

      await getBlogBySlug(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({ image: "https://signed.url" }),
        source: "database",
      });
    });
  });

  describe("updateBlog", () => {
    it("should return 400 if params validation fails", async () => {
      const req = createMockRequest({ params: { id: "" }, body: {} });
      const res = createMockResponse();

      await updateBlog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if blog does not exist", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { title: "Updated", tags: ["tech"], isPublished: true },
      });
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue(undefined as any);
      jest.mocked(blogModel.findOne).mockResolvedValue(null as never);

      await updateBlog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Blog not found" });
    });

    it("should return 400 if image file is invalid during update", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { title: "Updated", tags: ["tech"], isPublished: true },
      });
      const res = createMockResponse();

      const existingBlog = {
        _id: "507f1f77bcf86cd799439011",
        title: "Old Title",
      };

      jest.mocked(blogModel.findOne).mockResolvedValue(existingBlog as any);
      jest.mocked(getUploadedFile).mockReturnValue({ originalname: "bad.exe" } as any);
      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: false,
        error: { issues: [{ message: "Invalid file type" }] },
      } as any);

      await updateBlog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should queue blog update job and return 202 on success without new image", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { title: "Updated Title", tags: ["tech"], isPublished: true },
      });
      const res = createMockResponse();

      const existingBlog = {
        _id: "507f1f77bcf86cd799439011",
        title: "Old Title",
        slug: "old-title",
        excerpt: "Excerpt",
        content: "Content",
        image: "old-key.jpg",
        tags: ["tag1"],
        isPublished: true,
      };

      jest.mocked(blogModel.findOne).mockResolvedValue(existingBlog as any);
      jest.mocked(getUploadedFile).mockReturnValue(undefined as any);
      jest.mocked(CreateBlogJob).mockResolvedValue({ id: "job-update-1" } as any);

      await updateBlog(req, res as any);

      expect(CreateBlogJob).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "507f1f77bcf86cd799439011",
          title: "Updated Title",
        })
      );
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: "Blog update added to processing queue",
      });
    });

    it("should queue blog update job with new uploaded image and return 202 on success", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { title: "Updated Title", tags: ["tech"], isPublished: true },
      });
      const res = createMockResponse();

      const existingBlog = {
        _id: "507f1f77bcf86cd799439011",
        title: "Old Title",
        image: "old-key.jpg",
      };

      const mockFile = { buffer: Buffer.from("xyz"), originalname: "new.jpg" };
      jest.mocked(blogModel.findOne).mockResolvedValue(existingBlog as any);
      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: mockFile,
      } as any);
      jest.mocked(uploadWithRetry).mockResolvedValue({ key: "new-key.jpg" } as any);
      jest.mocked(CreateBlogJob).mockResolvedValue({ id: "job-update-2" } as any);

      await updateBlog(req, res as any);

      expect(uploadWithRetry).toHaveBeenCalled();
      expect(CreateBlogJob).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "507f1f77bcf86cd799439011",
          image: "new-key.jpg",
        })
      );
      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe("deleteBlog", () => {
    it("should return 400 on invalid params", async () => {
      const req = createMockRequest({ params: { id: "" } });
      const res = createMockResponse();

      await deleteBlog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if blog not found to delete", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(blogModel.findByIdAndDelete).mockResolvedValue(null as never);

      await deleteBlog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Blog not found" });
    });

    it("should delete blog, increment versions and return 200 on success", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(blogModel.findByIdAndDelete).mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        title: "Deleted Blog",
      } as any);

      await deleteBlog(req, res as any);

      expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Blog deleted successfully",
      });
    });

    it("should return 500 when delete operation throws error", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(blogModel.findByIdAndDelete).mockRejectedValue(new Error("DB delete failed") as never);

      await deleteBlog(req, res as any);

      expect(sendDangerNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
