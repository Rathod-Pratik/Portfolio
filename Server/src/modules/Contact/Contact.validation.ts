import { z } from "zod";

export const CreateContactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(1, "Mobile is required"),
    projectType: z.string().min(1, "Project type is required"),
    budget: z.string().min(1, "Budget is required"),
    message: z.string().min(1, "Message is required"),
    status: z
        .enum(["new", "contacted", "inProgress", "closed"])
        .optional(),
});

export const UpdateContactStatusSchema = z.object({
    status: z.enum(["new", "contacted", "inProgress", "closed"]),
});

export const ContactIdSchema = z.object({
    _id: z.string().min(1, "_id is required"),
});