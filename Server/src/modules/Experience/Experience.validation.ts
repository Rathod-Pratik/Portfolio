import { z } from "zod";

export const CreateExperienceSchema = z.object({
    year: z.string().min(1, "Year is required"),
    duration: z.string().min(1, "Duration is required"),
    title: z.string().min(1, "Title is required"),
    company: z.string().min(1, "Company is required"),
    description: z.string().min(1, "Description is required"),
});

export const UpdateExperienceSchema = z.object({
    year: z.string().min(1, "Year is required"),
    duration: z.string().min(1, "Duration is required"),
    title: z.string().min(1, "Title is required"),
    company: z.string().min(1, "Company is required"),
    description: z.string().min(1, "Description is required"),
});

export const ExperienceIdSchema = z.object({
    id: z.string().min(1, "Experience ID is required"),
});