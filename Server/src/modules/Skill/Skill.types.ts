export interface ISkill {
    _id?: string;
    language: string;
    percentage: number;
    color: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateSkillJob {
    type: "create";
    data: ISkill;
}

export interface IUpdateSkillJob {
    type: "update";
    skillId: string;
    data: Partial<ISkill>;
}

export type ISkillJob =
    | ICreateSkillJob
    | IUpdateSkillJob;