import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { INotificationJob } from "./Notification.types.ts";

export const NOTIFICATION_QUEUE_NAME = "notification";

export const notificationQueue =
    new Queue<INotificationJob>(
        NOTIFICATION_QUEUE_NAME,
        {
            connection: bellmqConnection,
            skipVersionCheck: true,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
                removeOnComplete: 100,
                removeOnFail: 100,
            },
        }
    );