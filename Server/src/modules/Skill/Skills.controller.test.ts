import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Skills.model.ts", () => ({
  SkillsModel: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.unstable_mockModule("./Skill.queue.ts", () => ({
  addCreateSkillJob: jest.fn(),
  addUpdateSkillJob: jest.fn(),
}));

jest.unstable_mockModule("../Notification/Notification.service.ts", () => ({
  sendInfoNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  getCacheVersion: jest.fn(),
  incrementCacheVersion: jest.fn(),
  SkillCacheKeys: {
    listVersion: jest.fn(() => "version:skill:list"),
    list: jest.fn((v: number, p: number, l: number) => `skill:list:${v}:${p}:${l}`),
    detailsVersion: jest.fn((id: string) => `version:skill:${id}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const {
  CreateSkill,
  EditSkill,
  DeleteSkill,
  GetSkill,
} = await import("./Skills.controller.ts");

const { SkillsModel } = await import("./Skills.model.ts");
const { addCreateSkillJob, addUpdateSkillJob } = await import("./Skill.queue.ts");
const {
  getCache,
  setCache,
  getCacheVersion,
  incrementCacheVersion,
} = await import("@utils");
const { sendInfoNotification } = await import("../Notification/Notification.service.ts");

describe("Skill Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CreateSkill", () => {
    it("should return 400 on validation failure", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await CreateSkill(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
        errors: expect.any(Object),
      });
    });

    it("should queue skill creation and return 202 on success", async () => {
      const req = createMockRequest({
        body: {
          language: "TypeScript",
          color: "#3178c6",
          percentage: 90,
        },
      });
      const res = createMockResponse();

      jest.mocked(addCreateSkillJob).mockResolvedValue({ id: "job-skill-1" } as any);

      await CreateSkill(req, res as any);

      expect(addCreateSkillJob).toHaveBeenCalledWith({
        language: "TypeScript",
        color: "#3178c6",
        percentage: 90,
      });
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Skill creation job added successfully",
        jobId: "job-skill-1",
      });
    });
  });

  describe("EditSkill", () => {
    it("should return 400 on validation failure", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await EditSkill(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if skill not found in DB", async () => {
      const req = createMockRequest({
        body: {
          _id: "507f1f77bcf86cd799439011",
          language: "Go",
          percentage: 85,
        },
      });
      const res = createMockResponse();

      jest.mocked(SkillsModel.findById).mockResolvedValue(null as never);

      await EditSkill(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Skill not found",
      });
    });

    it("should queue update job and return 202 on success", async () => {
      const req = createMockRequest({
        body: {
          _id: "507f1f77bcf86cd799439011",
          language: "Golang",
          color: "#00ADD8",
          percentage: 85,
        },
      });
      const res = createMockResponse();

      const existing = { _id: "507f1f77bcf86cd799439011", language: "Go" };
      jest.mocked(SkillsModel.findById).mockResolvedValue(existing as any);
      jest.mocked(addUpdateSkillJob).mockResolvedValue({ id: "job-skill-update-1" } as any);

      await EditSkill(req, res as any);

      expect(addUpdateSkillJob).toHaveBeenCalledWith("507f1f77bcf86cd799439011", {
        language: "Golang",
        color: "#00ADD8",
        percentage: 85,
      });
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe("DeleteSkill", () => {
    it("should return 400 if _id param is missing", async () => {
      const req = createMockRequest({ params: {} });
      const res = createMockResponse();

      await DeleteSkill(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if skill not found to delete", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(SkillsModel.findByIdAndDelete).mockResolvedValue(null as never);

      await DeleteSkill(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete skill, increment cache versions and return 200", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const existing = { _id: "507f1f77bcf86cd799439011", language: "Python" };
      jest.mocked(SkillsModel.findByIdAndDelete).mockResolvedValue(existing as any);

      await DeleteSkill(req, res as any);

      expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Skill deleted successfully",
      });
    });
  });

  describe("GetSkill", () => {
    it("should return cached skills if found", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue([{ language: "TypeScript" }] as never);

      await GetSkill(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ language: "TypeScript" }],
      });
    });

    it("should query database and set cache on cache miss", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);

      const mockSkills = [{ language: "TypeScript" }];
      const chain = {
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockSkills as never),
      };
      jest.mocked(SkillsModel.find).mockReturnValue(chain as any);

      await GetSkill(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSkills,
      });
    });
  });
});
