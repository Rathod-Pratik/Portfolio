import mongoose, { type HydratedDocument } from "mongoose";
import { NotificationType, type INotification } from "./Notification.types.ts";

const notificationSchema = new mongoose.Schema<INotification>(
    {
        type: {
            type: String,
            enum: Object.values(NotificationType),
            default: NotificationType.INFO,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        userId: {
            type: String,
            default: null,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export type NotificationDocument = HydratedDocument<INotification>;

export const NotificationModel = mongoose.model<INotification>(
    "notification",
    notificationSchema
);
