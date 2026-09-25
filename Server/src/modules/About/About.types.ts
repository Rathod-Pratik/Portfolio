export interface IAbout {
    content: string;
}

export interface IAboutCacheJob {
    aboutId: string;
    content: string;
}

export interface IAboutNotificationJob {
    type: "info" | "warning" | "danger";
    title: string;
    message: string;
}