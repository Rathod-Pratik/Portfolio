import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Notification.model.ts", () => ({
    NotificationModel: {
        find: jest.fn(),
        countDocuments: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        updateMany: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.unstable_mockModule("@utils", () => ({
    getCache: jest.fn(),
    setCache: jest.fn(),
    getCacheVersion: jest.fn(),
    incrementCacheVersion: jest.fn(),
    NotificationCacheKeys: {
        listVersion: jest.fn(() => "version:notification:list"),
        list: jest.fn((v: number, p: number, l: number, f: string) => `notification:list:${v}:${f}:${p}:${l}`),
        detailsVersion: jest.fn((id: string) => `version:notification:${id}`),
        details: jest.fn((id: string, v: number) => `notification:${id}:${v}`),
    },
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

const {
    getNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} = await import("./Notification.controller.ts");

const { NotificationModel } = await import("./Notification.model.ts");
const {
    getCache,
    setCache,
    getCacheVersion,
    incrementCacheVersion,
} = await import("@utils");

describe("Notification Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getNotifications", () => {
        it("should return cached notifications if present", async () => {
            const req = createMockRequest({ query: { page: "1", limit: "10" } });
            const res = createMockResponse();

            jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
            jest.mocked(getCache).mockResolvedValue({
                notifications: [{ title: "Test Notification" }],
                unreadCount: 1,
            } as never);

            await getNotifications(req, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: {
                    notifications: [{ title: "Test Notification" }],
                    unreadCount: 1,
                },
                source: "cache",
            });
        });

        it("should fetch notifications from DB when not in cache", async () => {
            const req = createMockRequest({ query: { page: "1", limit: "10" } });
            const res = createMockResponse();

            jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
            jest.mocked(getCache).mockResolvedValue(null as never);

            const mockLean = jest.fn().mockResolvedValue([{ title: "DB Notification" }] as never);
            const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
            const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
            const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

            jest.mocked(NotificationModel.find).mockReturnValue({ sort: mockSort } as never);
            jest.mocked(NotificationModel.countDocuments)
                .mockResolvedValueOnce(1 as never)
                .mockResolvedValueOnce(1 as never);

            await getNotifications(req, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    source: "database",
                    data: expect.objectContaining({
                        total: 1,
                        unreadCount: 1,
                    }),
                })
            );
        });

        it("should handle error gracefully", async () => {
            const req = createMockRequest();
            const res = createMockResponse();

            jest.mocked(getCacheVersion).mockRejectedValue(new Error("Redis error") as never);

            await getNotifications(req, res as any);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
        });
    });

    describe("getNotificationById", () => {
        it("should return notification from DB", async () => {
            const req = createMockRequest({ params: { id: "664f1c9d2f8a1a001e3b4d01" } });
            const res = createMockResponse();

            jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
            jest.mocked(getCache).mockResolvedValue(null as never);
            jest.mocked(NotificationModel.findOne).mockReturnValue({
                lean: jest.fn().mockResolvedValue({ _id: "664f1c9d2f8a1a001e3b4d01", title: "Test" } as never),
            } as never);

            await getNotificationById(req, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: { _id: "664f1c9d2f8a1a001e3b4d01", title: "Test" },
                source: "database",
            });
        });

        it("should return 404 when notification not found", async () => {
            const req = createMockRequest({ params: { id: "664f1c9d2f8a1a001e3b4d01" } });
            const res = createMockResponse();

            jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
            jest.mocked(getCache).mockResolvedValue(null as never);
            jest.mocked(NotificationModel.findOne).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null as never),
            } as never);

            await getNotificationById(req, res as any);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Notification not found" });
        });
    });

    describe("markAsRead", () => {
        it("should mark notification as read and invalidate cache", async () => {
            const req = createMockRequest({ params: { id: "664f1c9d2f8a1a001e3b4d01" } });
            const res = createMockResponse();

            jest.mocked(NotificationModel.findOneAndUpdate).mockResolvedValue({
                _id: "664f1c9d2f8a1a001e3b4d01",
                isRead: true,
            } as never);

            await markAsRead(req, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Notification marked as read",
                data: {
                    _id: "664f1c9d2f8a1a001e3b4d01",
                    isRead: true,
                },
            });
        });

        it("should return 404 when notification not found", async () => {
            const req = createMockRequest({ params: { id: "664f1c9d2f8a1a001e3b4d01" } });
            const res = createMockResponse();

            jest.mocked(NotificationModel.findOneAndUpdate).mockResolvedValue(null as never);

            await markAsRead(req, res as any);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Notification not found" });
        });
    });

    describe("markAllAsRead", () => {
        it("should update all unread notifications to read", async () => {
            const req = createMockRequest();
            const res = createMockResponse();

            jest.mocked(NotificationModel.updateMany).mockResolvedValue({ modifiedCount: 5 } as never);

            await markAllAsRead(req, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(incrementCacheVersion).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "All notifications marked as read",
            });
        });
    });

    describe("deleteNotification", () => {
        it("should soft delete notification", async () => {
            const req = createMockRequest({ params: { id: "664f1c9d2f8a1a001e3b4d01" } });
            const res = createMockResponse();

            jest.mocked(NotificationModel.findByIdAndUpdate).mockResolvedValue({
                _id: "664f1c9d2f8a1a001e3b4d01",
                isDeleted: true,
            } as never);

            await deleteNotification(req, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Notification deleted successfully",
            });
        });
    });

    describe("clearAllNotifications", () => {
        it("should soft delete all notifications", async () => {
            const req = createMockRequest();
            const res = createMockResponse();

            jest.mocked(NotificationModel.updateMany).mockResolvedValue({ modifiedCount: 10 } as never);

            await clearAllNotifications(req, res as any);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(incrementCacheVersion).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "All notifications cleared successfully",
            });
        });
    });
});
