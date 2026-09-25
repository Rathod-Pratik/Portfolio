import { z } from "zod";

const booleanFromFormData = z.preprocess(
    (value) => {
        if (value === "true" || value === true) {
            return true;
        }

        if (value === "false" || value === false) {
            return false;
        }

        return value;
    },
    z.boolean().optional()
);

const tagsFromFormData = z.preprocess(
    (value) => {
        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);

                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch {
                return value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean);
            }
        }

        return value;
    },
    z.array(z.string()).optional()
);

export const CreateBlogSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    excerpt: z.string().min(1, "Excerpt is required"),
    content: z.string().min(1, "Content is required"),
    tags: tagsFromFormData,
    isPublished: booleanFromFormData,
});

export const UpdateBlogSchema = z.object({
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    excerpt: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    tags: tagsFromFormData,
    isPublished: booleanFromFormData,
});

export const BlogIdSchema = z.object({
    id: z.string().min(1, "Blog ID is required"),
});