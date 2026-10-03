import mongoose, { type HydratedDocument } from "mongoose";
import type { INote } from "./Note.types.ts";

const notesSchema = new mongoose.Schema<INote>({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    note_image_url:{
        type:String,
        required:true
    },
    note_pdf_url:{
        type:String,
        required:true
    },
},{
    timestamps:true
})

export type NoteDocument = HydratedDocument<INote>;

export const NoteModel = mongoose.model<INote>('notes', notesSchema);