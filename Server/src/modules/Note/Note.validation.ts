import { z } from "zod";

export const CreateNoteSchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().min(1, "Description is required"),
});

export const UpdateNoteSchema = z.object({
    _id: z.string().min(1, "_id is required"),
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    description: z
        .string()
        .trim()
        .min(1, "Description cannot be empty")
        .optional(),
});

export const NoteIdSchema = z.object({
    _id: z.string().min(1, "_id is required"),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;