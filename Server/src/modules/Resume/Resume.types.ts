export interface IResume {
    CV: string;
}

export interface ICreateResumeJob {
    type: "create";
    data: IResume;
}

export interface IUpdateResumeJob {
    type: "update";
    resumeId: string;
    data: Partial<IResume>;
}

export type IResumeJob =
    | ICreateResumeJob
    | IUpdateResumeJob;