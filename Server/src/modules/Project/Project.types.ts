export interface IProject {
    title: string;
    subtitle?: string;
    difficult?: string;
    image?: string;
    content?: string;
    isDeleted?: boolean
}

export interface ICreateProjectJob {
    type: "create";
    data: IProject;
}

export interface IUpdateProjectJob {
    type: "update";
    projectId: string;
    data: Partial<IProject>;
}

export type IProjectJob =
    | ICreateProjectJob
    | IUpdateProjectJob;