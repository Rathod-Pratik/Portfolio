import { z } from "zod";

export const UpdateHeroSchema = z.object({
    greeting: z.string().optional(),
    name: z.string().optional(),
    roles: z.array(z.string()).optional(),
    description: z.string().optional(),
});

export const HeroIdSchema = z.object({
    id: z.string().min(1, "Hero ID is required"),
});