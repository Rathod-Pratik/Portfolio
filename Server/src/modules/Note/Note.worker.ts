import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import {
    incrementCacheVersion,
    NoteCacheKeys,
} from "@utils";
import { NOTE_QUEUE_NAME } from "./Note.queue.ts";
import { NoteModel } from "./Note.model.ts";
import type { INoteJob } from "./Note.types.ts";

export const noteWorker = new Worker<INoteJob>(
    NOTE_QUEUE_NAME,
    async (job) => {
        if (job.data.type === "create") {
            const note = await NoteModel.create(
                job.data.data,
            );

            await incrementCacheVersion(
                NoteCacheKeys.listVersion(),
            );

            return note;
        }

        const updatedNote =
            await NoteModel.findByIdAndUpdate(
                job.data.noteId,
                job.data.data,
                {
                    new: true,
                    runValidators: true,
                },
            );

        if (!updatedNote) {
            throw new Error("Note not found");
        }

        await incrementCacheVersion(
            NoteCacheKeys.listVersion(),
        );

        await incrementCacheVersion(
            NoteCacheKeys.detailsVersion(
                job.data.noteId,
            ),
        );

        return updatedNote;
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