export interface IExperience {
    year: string;
    duration?: string;
    title: string;
    company: string;
    description: string;
}

export interface IExperienceListCacheJob {
    type: "list";
    version: number;
    page: number;
    limit: number;
}

export interface IExperienceDetailsCacheJob {
    type: "details";
    experienceId: string;
    version: number;
}

export type IExperienceCacheJob =
    | IExperienceListCacheJob
    | IExperienceDetailsCacheJob;