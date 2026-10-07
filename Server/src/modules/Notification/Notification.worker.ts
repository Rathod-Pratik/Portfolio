import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { INotificationJob } from "./Notification.types.ts";
import { NotificationModel } from "./Notification.model.ts";
import { incrementCacheVersion, NotificationCacheKeys, logger } from "@utils";

export const notificationWorker =
    new Worker<INotificationJob>(
        "notification",
        async (job) => {
            const { notification } = job.data;

            const createdNotification = await NotificationModel.create({
                type: notification.type,
                title: notification.title,
                message: notification.message,
                userId: notification.userId || null,
                data: notification.data || null,
                isRead: false,
                isDeleted: false,
            });

            await incrementCacheVersion(NotificationCacheKeys.listVersion());

            await logger.info(`Notification saved to database: ${notification.title}`, {
                context: "NotificationWorker",
                metadata: { notificationId: createdNotification._id.toString() },
            });

            return createdNotification;
        },
        {
            connection: bellmqConnection,
            skipVersionCheck: true,
            concurrency: 5,
        }
    );

notificationWorker.on("completed", (job) => {
    logger.debug(`Notification job completed: ${job.id}`, { context: "NotificationWorker" });
});

notificationWorker.on("failed", (job, error) => {
    logger.error(
        `Notification job failed: ${job?.id}`,
        error instanceof Error ? error : { context: "NotificationWorker", metadata: { error: String(error) } }
    );
});

notificationWorker.on("error", (error) => {
    logger.error(
        "Notification worker error:",
        error instanceof Error ? error : { context: "NotificationWorker", metadata: { error: String(error) } }
    );
});