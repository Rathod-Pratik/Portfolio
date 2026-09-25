import type { HydratedDocument } from "mongoose";

export interface INote {
    title: string;
    description: string;
    note_image_url: string;
    note_pdf_url: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateNote {
    title?: string;
    description?: string;
    note_image_url?: string;
    note_pdf_url?: string;
}

export type NoteDocument = HydratedDocument<INote>;

export type NoteCacheJobAction =
    | "created"
    | "updated"
    | "deleted";

export interface INoteCacheJob {
    action: NoteCacheJobAction;
    noteId?: string;
}