import { z } from "zod";

export const NotificationIdSchema = z.object({
    id: z.string().min(1, "Notification ID is required"),
}).strict();

export const NotificationQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    type: z.enum(["info", "warning", "danger"]).optional(),
    unreadOnly: z
        .preprocess((val) => {
            if (val === "true" || val === true) return true;
            if (val === "false" || val === false) return false;
            return undefined;
        }, z.boolean().optional())
        .optional(),
});
