import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Logger.model.ts", () => ({
  LoggerModel: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

jest.unstable_mockModule("./Logger.queue.ts", () => ({
  addLogJob: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  getCacheVersion: jest.fn(),
  incrementCacheVersion: jest.fn(),
  LoggerCacheKeys: {
    listVersion: jest.fn(() => "version:logger:list"),
    list: jest.fn((v: number, p: number, l: number, f: string) => `logger:list:${v}:${p}:${l}:${f}`),
    detailsVersion: jest.fn((id: string) => `version:logger:${id}`),
    details: jest.fn((id: string, v: number) => `logger:${id}:${v}`),
  },
}));

const {
  getLogs,
  getLogById,
  createLog,
  deleteLog,
  clearLogs,
} = await import("./Logger.controller.ts");

const { LoggerModel } = await import("./Logger.model.ts");
const { addLogJob } = await import("./Logger.queue.ts");
const {
  getCache,
  setCache,
  getCacheVersion,
  incrementCacheVersion,
} = await import("@utils");

describe("Logger Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLogs", () => {
    it("should return cached logs if available", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue({ logs: [{ message: "cached log" }] } as never);

      await getLogs(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { logs: [{ message: "cached log" }] },
        source: "cache",
      });
    });

    it("should fetch logs from database and cache them on cache miss", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10", level: "error" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);

      const mockLogs = [{ message: "DB log error", level: "error" }];
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLogs as never),
      };
      jest.mocked(LoggerModel.find).mockReturnValue(chain as any);
      jest.mocked(LoggerModel.countDocuments).mockResolvedValue(1 as never);

      await getLogs(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          logs: mockLogs,
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        source: "database",
      });
    });
  });

  describe("getLogById", () => {
    it("should return 400 on invalid log ID param", async () => {
      const req = createMockRequest({ params: { id: "" } });
      const res = createMockResponse();

      await getLogById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return cached log if available", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue({ message: "Cached log item" } as never);

      await getLogById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { message: "Cached log item" },
        source: "cache",
      });
    });

    it("should return 404 if log not found in database", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(LoggerModel.findById).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      await getLogById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Log entry not found" });
    });

    it("should return log from DB and set cache", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const mockLog = { _id: "507f1f77bcf86cd799439011", message: "Found log" };
      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(LoggerModel.findById).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLog as never),
      } as any);

      await getLogById(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: mockLog,
        source: "database",
      });
    });
  });

  describe("createLog", () => {
    it("should return 400 on invalid body validation", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await createLog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should queue log and return 202 on valid input", async () => {
      const req = createMockRequest({
        body: {
          level: "info",
          message: "User logged in",
          context: "Auth",
        },
      });
      const res = createMockResponse();

      jest.mocked(addLogJob).mockResolvedValue({ id: "job-log-1" } as any);

      await createLog(req, res as any);

      expect(addLogJob).toHaveBeenCalledWith({
        level: "info",
        message: "User logged in",
        context: "Auth",
        metadata: undefined,
        stack: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: "Log queued successfully",
        jobId: "job-log-1",
      });
    });
  });

  describe("deleteLog", () => {
    it("should return 400 on invalid id param", async () => {
      const req = createMockRequest({ params: { id: "" } });
      const res = createMockResponse();

      await deleteLog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if log not found", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(LoggerModel.findByIdAndDelete).mockResolvedValue(null as never);

      await deleteLog(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete log, increment cache versions, and return 200", async () => {
      const req = createMockRequest({ params: { id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(LoggerModel.findByIdAndDelete).mockResolvedValue({ _id: "507f1f77bcf86cd799439011" } as any);

      await deleteLog(req, res as any);

      expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Log deleted successfully",
      });
    });
  });

  describe("clearLogs", () => {
    it("should delete all logs, increment cache and return 200", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(LoggerModel.deleteMany).mockResolvedValue({} as any);

      await clearLogs(req, res as any);

      expect(LoggerModel.deleteMany).toHaveBeenCalledWith({});
      expect(incrementCacheVersion).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "All logs cleared successfully",
      });
    });
  });
});
