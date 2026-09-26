import { z } from 'zod';

export const CreateProjectSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Title is required'),

    subtitle: z
        .string()
        .trim()
        .min(1, 'Subtitle is required'),

    description: z
        .string()
        .trim()
        .min(1, 'Description is required'),

    difficult: z
        .string()
        .trim()
        .min(1, 'Difficulty is required'),
});

export const EditProjectSchema = z.object({
    _id: z
        .string()
        .trim()
        .min(1, '_id is required'),

    title: z
        .string()
        .trim()
        .min(1, 'Title cannot be empty')
        .optional(),

    subtitle: z
        .string()
        .trim()
        .min(1, 'Subtitle cannot be empty')
        .optional(),
    description: z
        .string()
        .trim()
        .min(1, 'Description is required'),
    difficult: z
        .string()
        .trim()
        .min(1, 'Difficulty cannot be empty')
        .optional(),
});