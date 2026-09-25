import { z } from "zod";

export const CreateExpertiseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    linkTo: z.string().optional(),
});

export const UpdateExpertiseSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
    linkTo: z.string().optional(),
});

export const ExpertiseIdSchema = z.object({
    id: z.string().min(1, "Expertise ID is required"),
});