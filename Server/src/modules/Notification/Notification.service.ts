import { notificationQueue } from "./Notification.queue.ts";
import {
    NotificationType,
    type INotification,
} from "./Notification.types.ts";

export const sendNotification = async (
    notification: INotification
) => {
    return await notificationQueue.add(
        "send-notification",
        {
            notification,
        }
    );
};

export const sendInfoNotification = async (
    title: string,
    message: string,
    userId?: string,
    data?: Record<string, unknown>
) => {
    const notification: INotification = {
        type: NotificationType.INFO,
        title,
        message,
    };

    if (userId !== undefined) {
        notification.userId = userId;
    }

    if (data !== undefined) {
        notification.data = data;
    }

    return await sendNotification(notification);
};

export const sendWarningNotification = async (
    title: string,
    message: string,
    userId?: string,
    data?: Record<string, unknown>
) => {
    const notification: INotification = {
        type: NotificationType.WARNING,
        title,
        message,
    };

    if (userId !== undefined) {
        notification.userId = userId;
    }

    if (data !== undefined) {
        notification.data = data;
    }

    return await sendNotification(notification);
};

export const sendDangerNotification = async (
    title: string,
    message: string,
    userId?: string,
    data?: Record<string, unknown>
) => {
    const notification: INotification = {
        type: NotificationType.DANGER,
        title,
        message,
    };

    if (userId !== undefined) {
        notification.userId = userId;
    }

    if (data !== undefined) {
        notification.data = data;
    }

    return await sendNotification(notification);
};