export enum NotificationType {
    INFO = "info",
    WARNING = "warning",
    DANGER = "danger",
}

export interface INotification {
    type: NotificationType;
    title: string;
    message: string;
    userId?: string;
    data?: Record<string, unknown>;
}

export interface INotificationJob {
    notification: INotification;
}