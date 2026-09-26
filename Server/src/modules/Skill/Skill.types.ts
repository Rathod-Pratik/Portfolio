import type { ISkill } from "@type";

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