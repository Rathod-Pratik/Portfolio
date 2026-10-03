export enum NotificationType {
    INFO = "info",
    WARNING = "warning",
    DANGER = "danger",
}

export interface INotification {
    _id?: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead?: boolean;
    userId?: string;
    data?: Record<string, unknown>;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface INotificationJob {
    notification: INotification;
}