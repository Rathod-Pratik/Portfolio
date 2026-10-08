import type { Request, Response } from "express";
import { NotificationModel } from "./Notification.model.ts";
import {
    logger,
} from "@utils";
import {
    NotificationIdSchema,
    NotificationQuerySchema,
} from "./Notification.validation.ts";

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const queryValidation = NotificationQuerySchema.safeParse(req.query);

        const page = queryValidation.success ? queryValidation.data.page : 1;
        const limit = queryValidation.success ? queryValidation.data.limit : 10;
        const type = queryValidation.success ? queryValidation.data.type : undefined;
        const unreadOnly = queryValidation.success ? queryValidation.data.unreadOnly : undefined;

        const filter: Record<string, unknown> = { isDeleted: false };
        if (type) filter.type = type;
        if (unreadOnly) filter.isRead = false;

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            NotificationModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            NotificationModel.countDocuments(filter),
            NotificationModel.countDocuments({ isDeleted: false, isRead: false }),
        ]);

        const result = {
            notifications,
            total,
            unreadCount,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

        await logger.info(`Fetched ${notifications.length} notifications from database`, {
            context: "NotificationController",
        });

        return res.status(200).json({
            data: result,
            source: "database",
        });
    } catch (error) {
        await logger.error(
            "Get notifications error",
            error instanceof Error ? error : { context: "NotificationController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getNotificationById = async (req: Request, res: Response) => {
    try {
        const validation = NotificationIdSchema.safeParse(req.params);
        if (!validation.success) {
            await logger.warn("Get notification by ID validation failed", {
                context: "NotificationController",
                metadata: { errors: validation.error.issues },
            });
            return res.status(400).json({
                message: validation.error.issues,
            });
        }

        const { id } = validation.data;
        const notification = await NotificationModel.findOne({ _id: id, isDeleted: false }).lean();
        if (!notification) {
            await logger.warn(`Notification not found with ID: ${id}`, { context: "NotificationController" });
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            data: notification,
            source: "database",
        });
    } catch (error) {
        await logger.error(
            "Get notification by ID error",
            error instanceof Error ? error : { context: "NotificationController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const validation = NotificationIdSchema.safeParse(req.params);
        if (!validation.success) {
            await logger.warn("Mark notification read validation failed", {
                context: "NotificationController",
                metadata: { errors: validation.error.issues },
            });
            return res.status(400).json({
                message: validation.error.issues,
            });
        }

        const { id } = validation.data;
        const notification = await NotificationModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            await logger.warn(`Mark notification read: Not found with ID: ${id}`, {
                context: "NotificationController",
            });
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        await logger.info(`Notification marked as read: ${id}`, { context: "NotificationController" });

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    } catch (error) {
        await logger.error(
            "Mark notification as read error",
            error instanceof Error ? error : { context: "NotificationController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const markAllAsRead = async (_req: Request, res: Response) => {
    try {
        await NotificationModel.updateMany(
            { isDeleted: false, isRead: false },
            { isRead: true }
        );

        await logger.info("All notifications marked as read", { context: "NotificationController" });

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        await logger.error(
            "Mark all notifications as read error",
            error instanceof Error ? error : { context: "NotificationController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const validation = NotificationIdSchema.safeParse(req.params);
        if (!validation.success) {
            await logger.warn("Delete notification validation failed", {
                context: "NotificationController",
                metadata: { errors: validation.error.issues },
            });
            return res.status(400).json({
                message: validation.error.issues,
            });
        }

        const { id } = validation.data;
        const notification = await NotificationModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!notification) {
            await logger.warn(`Delete notification: Not found with ID: ${id}`, {
                context: "NotificationController",
            });
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        await logger.info(`Notification deleted: ${id}`, { context: "NotificationController" });

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        await logger.error(
            "Delete notification error",
            error instanceof Error ? error : { context: "NotificationController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const clearAllNotifications = async (_req: Request, res: Response) => {
    try {
        await NotificationModel.updateMany(
            { isDeleted: false },
            { isDeleted: true }
        );

        await logger.info("All notifications cleared successfully", { context: "NotificationController" });

        return res.status(200).json({
            success: true,
            message: "All notifications cleared successfully",
        });
    } catch (error) {
        await logger.error(
            "Clear all notifications error",
            error instanceof Error ? error : { context: "NotificationController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
