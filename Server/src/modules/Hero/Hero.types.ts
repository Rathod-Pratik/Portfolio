export interface IHero {
    greeting?: string;
    name?: string;
    roles?: string[];
    description?: string;
    image?: string;
}

export interface IHeroCacheJob {
    type: "details";
    version: number;
}