export type ContactStatus =
    | "new"
    | "contacted"
    | "inProgress"
    | "closed";

export interface IContact {
    name: string;
    email: string;
    mobile: string;
    projectType: string;
    budget: string;
    status: ContactStatus;
    message: string;
    isDeleted?: boolean;
}