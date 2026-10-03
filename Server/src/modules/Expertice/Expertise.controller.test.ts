import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Expertise.model.ts", () => ({
  ExpertiseModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.unstable_mockModule("./Expertise.queue.ts", () => ({
  addCreateExpertiseJob: jest.fn(),
  addUpdateExpertiseJob: jest.fn(),
}));

jest.unstable_mockModule("@modules/Notification/Notification.service.ts", () => ({
  sendInfoNotification: jest.fn(),
  sendDangerNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  Get_Signed_Url: jest.fn(),
  uploadFileToS3: jest.fn(),
  getCache: jest.fn(),
  setCache: jest.fn(),
  getCacheVersion: jest.fn(),
  incrementCacheVersion: jest.fn(),
  uploadWithRetry: jest.fn(),
  getUploadedFile: jest.fn(),
  ImageFileSchema: {
    safeParse: jest.fn((file) => {
      if (!file) return { success: true, data: undefined };
      return { success: true, data: file };
    }),
  },
  ExpertiseCacheKeys: {
    listVersion: jest.fn(() => "version:expertise:list"),
    list: jest.fn((v: number, p: number, l: number) => `expertise:list:${v}:${p}:${l}`),
    detailsVersion: jest.fn((id: string) => `version:expertise:${id}`),
    details: jest.fn((id: string, v: number) => `expertise:${id}:${v}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const {
  createExpertise,
  getExpertise,
  getExpertiseById,
  updateExpertise,
  deleteExpertise,
} = await import("./Expertise.controller.ts");

const { ExpertiseModel } = await import("./Expertise.model.ts");
const { addCreateExpertiseJob, addUpdateExpertiseJob } = await import("./Expertise.queue.ts");
const {
  Get_Signed_Url,
  getCache,
  setCache,
  getCacheVersion,
  incrementCacheVersion,
  uploadWithRetry,
  getUploadedFile,
  ImageFileSchema,
} = await import("@utils");
const { sendInfoNotification } = await import("@modules/Notification/Notification.service.ts");

describe("Expertise Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createExpertise", () => {
    it("should return 400 on invalid body", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await createExpertise(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 on missing/invalid image file", async () => {
      const req = createMockRequest({
        body: { title: "Backend Development", description: "Node.js and TypeScript" },
      });
      const res = createMockResponse();

      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: false,
        error: { issues: [{ message: "Invalid image" }] },
      } as any);

      await createExpertise(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should upload image, queue job and return 202 on success", async () => {
      const req = createMockRequest({
        body: { title: "Backend Development", description: "Node.js and TypeScript" },
      });
      const res = createMockResponse();

      const mockFile = { originalname: "exp.png" };
      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: mockFile,
      } as any);
      jest.mocked(uploadWithRetry).mockResolvedValue({ key: "expertise/exp.png" } as any);
      jest.mocked(addCreateExpertiseJob).mockResolvedValue({ id: "job-exp-1" } as any);

      await createExpertise(req, res as any);

      expect(uploadWithRetry).toHaveBeenCalled();
      expect(addCreateExpertiseJob).toHaveBeenCalledWith({
        title: "Backend Development",
        description: "Node.js and TypeScript",
        image: "expertise/exp.png",
      });
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: "job-exp-1" })
      );
    });
  });

  describe("getExpertise", () => {
    it("should return cached data if present", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue([{ title: "Cached Expert" }] as never);

      await getExpertise(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [{ title: "Cached Expert" }],
        source: "cache",
      });
    });

    it("should query database and generate signed URLs on cache miss", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);

      const mockItems = [{ title: "Item 1", image: "key1" }];
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockItems as never),
      };
      jest.mocked(ExpertiseModel.find).mockReturnValue(chain as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed.url" as never);

      await getExpertise(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [expect.objectContaining({ title: "Item 1", image: "https://signed.url" })],
        source: "database",
      });
    });
  });

  describe("getExpertiseById", () => {
    it("should return 400 on invalid id parameter", async () => {
      const req = createMockRequest({ params: { id: "" } });
      const res = createMockResponse();

      await getExpertiseById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return cached item if available", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue({ title: "Cached" } as never);

      await getExpertiseById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { title: "Cached" },
        source: "cache",
      });
    });

    it("should return 404 if item not found in DB", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(ExpertiseModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      await getExpertiseById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return item with signed url and cache it", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const mockExp = { _id: "507f1f77bcf86cd799439011", title: "API", image: "img-key" };
      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(ExpertiseModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockExp as never),
      } as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed-url" as never);

      await getExpertiseById(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({ image: "https://signed-url" }),
        source: "database",
      });
    });
  });

  describe("updateExpertise", () => {
    it("should return 400 on invalid body or id", async () => {
      const req = createMockRequest({
        params: { id: "" },
        body: { title: "New" },
      });
      const res = createMockResponse();

      await updateExpertise(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if expertise not found", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { title: "New Title", description: "New Desc" },
      });
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue(undefined as any);
      jest.mocked(ExpertiseModel.findOne).mockResolvedValue(null as never);

      await updateExpertise(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should queue update job and return 202 on success without new image", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { title: "Updated Backend", description: "Updated Desc" },
      });
      const res = createMockResponse();

      const existing = {
        _id: "507f1f77bcf86cd799439011",
        title: "Old Backend",
        description: "Old Desc",
        image: "old.png",
      };

      jest.mocked(getUploadedFile).mockReturnValue(undefined as any);
      jest.mocked(ExpertiseModel.findOne).mockResolvedValue(existing as any);
      jest.mocked(addUpdateExpertiseJob).mockResolvedValue({ id: "job-update-1" } as any);

      await updateExpertise(req, res as any);

      expect(addUpdateExpertiseJob).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({ title: "Updated Backend", description: "Updated Desc" })
      );
      expect(res.status).toHaveBeenCalledWith(202);
    });

    it("should upload new image and queue update job with new image", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { title: "Updated Backend" },
      });
      const res = createMockResponse();

      const existing = {
        _id: "507f1f77bcf86cd799439011",
        title: "Old Backend",
        description: "Old Desc",
        image: "old.png",
      };

      const mockFile = { buffer: Buffer.from("test"), originalname: "new.png" };
      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: mockFile,
      } as any);
      jest.mocked(ExpertiseModel.findOne).mockResolvedValue(existing as any);
      jest.mocked(uploadWithRetry).mockResolvedValue({ key: "expertise/new.png" } as any);
      jest.mocked(addUpdateExpertiseJob).mockResolvedValue({ id: "job-update-2" } as any);

      await updateExpertise(req, res as any);

      expect(uploadWithRetry).toHaveBeenCalled();
      expect(addUpdateExpertiseJob).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({ image: "expertise/new.png" })
      );
      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe("deleteExpertise", () => {
    it("should return 400 on invalid params", async () => {
      const req = createMockRequest({ params: { id: "" } });
      const res = createMockResponse();

      await deleteExpertise(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if expertise not found", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(ExpertiseModel.findOne).mockResolvedValue(null as never);

      await deleteExpertise(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete expertise, increment versions and return 200 on success", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const existing = { _id: "507f1f77bcf86cd799439011", title: "Backend" };
      jest.mocked(ExpertiseModel.findOne).mockResolvedValue(existing as any);
      jest.mocked(ExpertiseModel.findByIdAndUpdate).mockResolvedValue(existing as any);

      await deleteExpertise(req, res as any);

      expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Expertise deleted successfully",
      });
    });
  });
});
