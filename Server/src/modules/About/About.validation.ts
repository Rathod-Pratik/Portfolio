import { z } from "zod"

export const AboutSchema = z.object({
    content: z.string().min(1, "Content is required"),
}).strict();