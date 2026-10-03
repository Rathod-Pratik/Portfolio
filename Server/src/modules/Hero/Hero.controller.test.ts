import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Hero.model.ts", () => ({
  HeroModel: {
    findOne: jest.fn(),
  },
}));

jest.unstable_mockModule("./Hero.queue.ts", () => ({
  addUpdateHeroJob: jest.fn(),
}));

jest.unstable_mockModule("@modules/Notification/Notification.service.ts", () => ({
  sendInfoNotification: jest.fn(),
  sendDangerNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  getCacheVersion: jest.fn(),
  HERO_ID: "hero_main",
  getUploadedFile: jest.fn(),
  Get_Signed_Url: jest.fn(),
  uploadWithRetry: jest.fn(),
  ImageFileSchema: {
    safeParse: jest.fn((file) => {
      if (!file) return { success: true, data: undefined };
      return { success: true, data: file };
    }),
  },
  HeroCacheKeys: {
    detailsVersion: jest.fn((id: string) => `version:hero:${id}`),
    details: jest.fn((id: string, version: number) => `hero:${id}:${version}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { getHero, updateHero } = await import("./Hero.controller.ts");
const { HeroModel } = await import("./Hero.model.ts");
const { addUpdateHeroJob } = await import("./Hero.queue.ts");
const {
  getCache,
  setCache,
  getCacheVersion,
  getUploadedFile,
  Get_Signed_Url,
  uploadWithRetry,
  ImageFileSchema,
} = await import("@utils");
const { sendInfoNotification } = await import("@modules/Notification/Notification.service.ts");

describe("Hero Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getHero", () => {
    it("should return cached hero if found", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue({ name: "John Doe" } as never);

      await getHero(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { name: "John Doe" },
        source: "cache",
      });
    });

    it("should return 404 if hero not found in database", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(HeroModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      await getHero(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Hero not found" });
    });

    it("should sign image, cache hero and return 200 on db hit", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const mockHero = {
        greeting: "Hi",
        name: "Pratik",
        roles: ["Developer"],
        description: "Full Stack",
        image: "hero.jpg",
      };

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(HeroModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockHero as never),
      } as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed.url/hero.jpg" as never);

      await getHero(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({ image: "https://signed.url/hero.jpg" }),
        source: "database",
      });
    });
  });

  describe("updateHero", () => {
    it("should return 400 on invalid body validation", async () => {
      const req = createMockRequest({ body: { name: 123 } });
      const res = createMockResponse();

      await updateHero(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if hero does not exist in DB", async () => {
      const req = createMockRequest({
        body: { name: "Pratik", greeting: "Hello" },
      });
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue(undefined as any);
      jest.mocked(HeroModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      await updateHero(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Hero not found" });
    });

    it("should queue update job without new image and return 202", async () => {
      const req = createMockRequest({
        body: { name: "Updated Name", greeting: "Hey!" },
      });
      const res = createMockResponse();

      const existingHero = {
        name: "Old Name",
        greeting: "Old Greeting",
        roles: ["Engineer"],
        description: "Bio",
        image: "old.jpg",
      };

      jest.mocked(getUploadedFile).mockReturnValue(undefined as any);
      jest.mocked(HeroModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingHero as never),
      } as any);
      jest.mocked(addUpdateHeroJob).mockResolvedValue({ id: "hero-job-1" } as any);

      await updateHero(req, res as any);

      expect(addUpdateHeroJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated Name",
          image: "old.jpg",
        })
      );
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("was added to the update queue"),
        jobId: "hero-job-1",
      });
    });

    it("should upload file if provided, queue update job and return 202", async () => {
      const req = createMockRequest({
        body: { name: "Updated Name", greeting: "Hey!" },
      });
      const res = createMockResponse();

      const existingHero = {
        name: "Old Name",
        greeting: "Old Greeting",
        roles: ["Engineer"],
        description: "Bio",
        image: "old.jpg",
      };

      const mockFile = { buffer: Buffer.from("test"), originalname: "avatar.png" };
      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(ImageFileSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: mockFile,
      } as any);
      jest.mocked(HeroModel.findOne).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingHero as never),
      } as any);
      jest.mocked(uploadWithRetry).mockResolvedValue({ key: "hero/new.png" } as any);
      jest.mocked(addUpdateHeroJob).mockResolvedValue({ id: "hero-job-2" } as any);

      await updateHero(req, res as any);

      expect(uploadWithRetry).toHaveBeenCalled();
      expect(addUpdateHeroJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated Name",
          image: "hero/new.png",
        })
      );
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("was added to the update queue"),
        jobId: "hero-job-2",
      });
    });
  });
});
