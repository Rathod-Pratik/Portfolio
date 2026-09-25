import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { INotificationJob } from "./Notification.types.ts";

export const notificationWorker =
    new Worker<INotificationJob>(
        "notification",
        async (job) => {
            const notification =
                job.data.notification;

            console.log(
                "Notification:",
                notification
            );

            return notification;
        },
        {
            connection: bellmqConnection,
            concurrency: 5,
        }
    );

notificationWorker.on("completed", (job) => {
    console.log(
        `Notification job completed: ${job.id}`
    );
});

notificationWorker.on("failed", (job, error) => {
    console.error(
        `Notification job failed: ${job?.id}`,
        error
    );
});

notificationWorker.on("error", (error) => {
    console.error(
        "Notification worker error:",
        error
    );
});