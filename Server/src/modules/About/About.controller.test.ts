import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./About.model.ts", () => ({
  AboutModel: {
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule("./About.queue.ts", () => ({
  addAboutCacheJob: jest.fn(),
}));

jest.unstable_mockModule("@modules/Notification/Notification.service.ts", () => ({
  sendInfoNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  getCacheVersion: jest.fn(),
  AboutCacheKeys: {
    detailsVersion: jest.fn((id: string) => `version:about:${id}`),
    details: jest.fn((id: string, version: number) => `about:${id}:${version}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { getAbout, updateAbout } = await import("./About.controller.ts");
const { AboutModel } = await import("./About.model.ts");
const { addAboutCacheJob } = await import("./About.queue.ts");
const { getCache, setCache, getCacheVersion } = await import("@utils");
const { sendInfoNotification } = await import("@modules/Notification/Notification.service.ts");

describe("About Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAbout", () => {
    it("should return cached data if cache hit", async () => {
      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue({ content: "Cached about content" } as never);

      const req = createMockRequest();
      const res = createMockResponse();

      await getAbout(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { content: "Cached about content" },
        source: "cache",
      });
      expect(AboutModel.findOne).not.toHaveBeenCalled();
    });

    it("should return database data and set cache on cache miss", async () => {
      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      const mockAbout = { content: "DB about content" };
      jest.mocked(AboutModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAbout as never),
      } as any);

      const req = createMockRequest();
      const res = createMockResponse();

      await getAbout(req, res as any);

      expect(AboutModel.findOne).toHaveBeenCalled();
      expect(setCache).toHaveBeenCalledWith("about:about:1", mockAbout, 600);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: mockAbout,
        source: "database",
      });
    });

    it("should return 404 if about information is not found in database", async () => {
      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(AboutModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      const req = createMockRequest();
      const res = createMockResponse();

      await getAbout(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "About information not found",
      });
    });

    it("should return 500 on server error", async () => {
      jest.mocked(getCacheVersion).mockRejectedValue(new Error("Redis error") as never);

      const req = createMockRequest();
      const res = createMockResponse();

      await getAbout(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("updateAbout", () => {
    it("should return 400 if validation fails", async () => {
      const req = createMockRequest({
        body: { content: "" },
      });
      const res = createMockResponse();

      await updateAbout(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(Array),
        })
      );
    });

    it("should queue update job and send notification on valid input", async () => {
      const req = createMockRequest({
        body: { content: "Updated about content info" },
      });
      const res = createMockResponse();

      jest.mocked(addAboutCacheJob).mockResolvedValue({ id: "job-123" } as any);

      await updateAbout(req, res as any);

      expect(addAboutCacheJob).toHaveBeenCalledWith({
        content: "Updated about content info",
      });
      expect(sendInfoNotification).toHaveBeenCalledWith(
        "About Updated",
        "About information was updated successfully."
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "About updated successfully",
      });
    });

    it("should return 500 when queue job fails", async () => {
      const req = createMockRequest({
        body: { content: "Valid about description content" },
      });
      const res = createMockResponse();

      jest.mocked(addAboutCacheJob).mockRejectedValue(new Error("Queue error") as never);

      await updateAbout(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });
});
