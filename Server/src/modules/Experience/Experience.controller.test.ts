import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Experience.model.ts", () => ({
  ExperienceModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.unstable_mockModule("./Experience.queue.ts", () => ({
  addCreateExperienceJob: jest.fn(),
  addUpdateExperienceJob: jest.fn(),
}));

jest.unstable_mockModule("@modules/Notification/Notification.service.ts", () => ({
  sendInfoNotification: jest.fn(),
  sendDangerNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  getCacheVersion: jest.fn(),
  incrementCacheVersion: jest.fn(),
  ExperienceCacheKeys: {
    listVersion: jest.fn(() => "version:experience:list"),
    list: jest.fn((v: number, p: number, l: number) => `experience:list:${v}:${p}:${l}`),
    detailsVersion: jest.fn((id: string) => `version:experience:${id}`),
    details: jest.fn((id: string, v: number) => `experience:${id}:${v}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
} = await import("./Experience.controller.ts");

const { ExperienceModel } = await import("./Experience.model.ts");
const { addCreateExperienceJob, addUpdateExperienceJob } = await import("./Experience.queue.ts");
const {
  getCache,
  setCache,
  getCacheVersion,
  incrementCacheVersion,
} = await import("@utils");
const { sendInfoNotification } = await import("@modules/Notification/Notification.service.ts");

describe("Experience Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createExperience", () => {
    it("should return 400 on validation failure", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await createExperience(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should queue experience creation and return 202 on success", async () => {
      const req = createMockRequest({
        body: {
          year: "2023 - Present",
          duration: "2 years",
          title: "Full Stack Engineer",
          company: "Acme Corp",
          description: "Building scalable cloud web applications.",
        },
      });
      const res = createMockResponse();

      jest.mocked(addCreateExperienceJob).mockResolvedValue({ id: "job-exp-1" } as any);

      await createExperience(req, res as any);

      expect(addCreateExperienceJob).toHaveBeenCalled();
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("was added to the creation queue"),
      });
    });

    it("should return 500 when job creation fails", async () => {
      const req = createMockRequest({
        body: {
          year: "2023 - Present",
          duration: "2 years",
          title: "Full Stack Engineer",
          company: "Acme Corp",
          description: "Building scalable web applications.",
        },
      });
      const res = createMockResponse();

      jest.mocked(addCreateExperienceJob).mockRejectedValue(new Error("Queue error") as never);

      await createExperience(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getExperiences", () => {
    it("should return cached experiences if available", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue([{ title: "Cached Experience" }] as never);

      await getExperiences(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [{ title: "Cached Experience" }],
        source: "cache",
      });
    });

    it("should query database and set cache on cache miss", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);

      const mockData = [{ title: "Engineer", company: "Google" }];
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockData as never),
      };
      jest.mocked(ExperienceModel.find).mockReturnValue(chain as any);

      await getExperiences(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: mockData,
        source: "database",
      });
    });
  });

  describe("getExperienceById", () => {
    it("should return 400 on invalid id parameter", async () => {
      const req = createMockRequest({ params: { id: "" } });
      const res = createMockResponse();

      await getExperienceById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return cached item if available", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue({ title: "Cached Experience" } as never);

      await getExperienceById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { title: "Cached Experience" },
        source: "cache",
      });
    });

    it("should return 404 if experience not found in DB", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(ExperienceModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      await getExperienceById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Experience not found" });
    });

    it("should return experience from DB and cache it on cache miss", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const mockExp = { _id: "507f1f77bcf86cd799439011", title: "Dev" };
      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(ExperienceModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockExp as never),
      } as any);

      await getExperienceById(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: mockExp,
        source: "database",
      });
    });
  });

  describe("updateExperience", () => {
    it("should return 400 on invalid body", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { title: 123 },
      });
      const res = createMockResponse();

      await updateExperience(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 on invalid param id", async () => {
      const req = createMockRequest({
        params: { id: "" },
        body: {
          year: "2023",
          duration: "1 yr",
          title: "New Title",
          company: "Acme",
          description: "Desc",
        },
      });
      const res = createMockResponse();

      await updateExperience(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if experience not found", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: {
          year: "2023",
          duration: "1 yr",
          title: "New Title",
          company: "Acme",
          description: "Desc",
        },
      });
      const res = createMockResponse();

      jest.mocked(ExperienceModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      await updateExperience(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should queue update job and return 202 on success", async () => {
      const req = createMockRequest({
        params: { id: "507f1f77bcf86cd799439011" },
        body: {
          year: "2023",
          duration: "2 years",
          title: "Senior Engineer",
          company: "Meta",
          description: "Coding scalable backends",
        },
      });
      const res = createMockResponse();

      const existing = {
        _id: "507f1f77bcf86cd799439011",
        year: "2022",
        duration: "1 year",
        title: "Engineer",
        company: "Meta",
        description: "Coding",
      };

      jest.mocked(ExperienceModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existing as never),
      } as any);
      jest.mocked(addUpdateExperienceJob).mockResolvedValue({ id: "job-update-1" } as any);

      await updateExperience(req, res as any);

      expect(addUpdateExperienceJob).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({ title: "Senior Engineer", company: "Meta" })
      );
      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe("deleteExperience", () => {
    it("should return 400 on invalid param id", async () => {
      const req = createMockRequest({ params: { id: "" } });
      const res = createMockResponse();

      await deleteExperience(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if experience not found", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(ExperienceModel.findByIdAndUpdate).mockResolvedValue(null as never);

      await deleteExperience(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete experience and return 200 on success", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(ExperienceModel.findByIdAndUpdate).mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        title: "Engineer",
      } as any);

      await deleteExperience(req, res as any);

      expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Experience deleted successfully",
      });
    });
  });
});
