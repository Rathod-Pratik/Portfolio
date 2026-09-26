export interface IExperience {
    year: string;
    duration?: string;
    title: string;
    company: string;
    description: string;
}

export interface ICreateExperienceJob {
    type: "create";
    data: IExperience;
}

export interface IUpdateExperienceJob {
    type: "update";
    experienceId: string;
    data: IExperience;
}

export type IExperienceJob =
    | ICreateExperienceJob
    | IUpdateExperienceJob;