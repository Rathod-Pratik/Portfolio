export interface IExpertice {
    title: string;
    description: string;
    image: string;
    linkTo?: string;
}

export interface ICreateExpertiseJob {
    type: "create";
    data: IExpertice;
}

export interface IUpdateExpertiseJob {
    type: "update";
    expertiseId: string;
    data: Partial<IExpertice>;
}

export type IExpertiseJob =
    | ICreateExpertiseJob
    | IUpdateExpertiseJob;