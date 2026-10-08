import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import {
    logger,
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

            await logger.info(`Note created in DB: ${note.title}`, {
                context: "NoteWorker",
                metadata: { noteId: note._id.toString(), jobId: job.id },
            });

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
            await logger.warn(`Note worker update failed: ID not found: ${job.data.noteId}`, { context: "NoteWorker" });
            throw new Error("Note not found");
        }


        await logger.info(`Note updated in DB for ID: ${job.data.noteId}`, {
            context: "NoteWorker",
            metadata: { noteId: job.data.noteId, jobId: job.id },
        });

        return updatedNote;
    },
    {
        connection: bellmqConnection,
        skipVersionCheck: true,
        concurrency: 5,
    },
);

noteWorker.on("completed", (job) => {
    logger.info(`Note job completed: ${job.id}`, { context: "NoteWorker", metadata: { jobId: job.id } });
});

noteWorker.on("failed", (job, error) => {
    logger.error(
        `Note job failed [${job?.id}]`,
        error instanceof Error ? error : { context: "NoteWorker", metadata: { jobId: job?.id, error: String(error) } }
    );
});

noteWorker.on("error", (error) => {
    logger.error(
        "Note worker error",
        error instanceof Error ? error : { context: "NoteWorker", metadata: { error: String(error) } }
    );
});
