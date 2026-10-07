import { Queue } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import type { INote, INoteJob } from "./Note.types.ts";

export const NOTE_QUEUE_NAME = "note";

export const noteQueue = new Queue<INoteJob>(
    NOTE_QUEUE_NAME,
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
    },
);

export const addCreateNoteJob = async (
    data: INote,
) => {
    return await noteQueue.add(
        "create-note",
        {
            type: "create",
            data,
        },
    );
};

export const addUpdateNoteJob = async (
    noteId: string,
    data: Partial<INote>,
) => {
    return await noteQueue.add(
        "update-note",
        {
            type: "update",
            noteId,
            data,
        },
    );
};