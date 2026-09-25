import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import {
    incrementCacheVersion, NoteCacheKeys
} from "@utils";
import { sendInfoNotification } from "../Notification/Notification.service.ts";
import {
    NOTE_QUEUE_NAME,
} from "./Note.queue.ts";
import type {
    INoteCacheJob,
} from "./Note.types.ts";

export const noteWorker = new Worker<INoteCacheJob>(
    NOTE_QUEUE_NAME,
    async (job) => {
        const { action, noteId } = job.data;

        await incrementCacheVersion(
            NoteCacheKeys.listVersion(),
        );

        if (noteId) {
            await incrementCacheVersion(
                NoteCacheKeys.detailsVersion(noteId),
            );
        }

        await sendInfoNotification(
            "Note Updated",
            `Note ${action} successfully.`,
        );

        return {
            success: true,
            action,
            noteId,
        };
    },
    {
        connection: bellmqConnection,
        concurrency: 5,
    },
);

noteWorker.on("completed", (job) => {
    console.log(`Note job completed: ${job.id}`);
});

noteWorker.on("failed", (job, error) => {
    console.error(
        `Note job failed [${job?.id}]:`,
        error,
    );
});

noteWorker.on("error", (error) => {
    console.error("Note worker error:", error);
});