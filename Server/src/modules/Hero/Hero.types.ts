export interface IHero {
    greeting: string;
    name: string;
    roles: string[];
    description: string;
    image: string;
}

export interface IUpdateHeroJob {
    type: "update";
    data: Partial<IHero>;
}

export type IHeroJob = IUpdateHeroJob;