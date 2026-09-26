import { z } from "zod";

export const CreateSkillSchema = z.object({
    language: z
        .string()
        .trim()
        .min(1, "Language is required"),

    color: z
        .string()
        .trim()
        .min(1, "Color is required"),

    percentage: z
        .number({
            error: "Percentage is required",
        })
        .min(0, "Percentage cannot be less than 0")
        .max(100, "Percentage cannot be greater than 100"),
});

export const EditSkillSchema = z.object({
    _id: z
        .string()
        .trim()
        .min(1, "_id is required"),

    language: z
        .string()
        .trim()
        .min(1, "Language cannot be empty")
        .optional(),

    color: z
        .string()
        .trim()
        .min(1, "Color cannot be empty")
        .optional(),

    percentage: z
        .number()
        .min(0, "Percentage cannot be less than 0")
        .max(100, "Percentage cannot be greater than 100")
        .optional(),
});