export interface IExpertice {
    title: string;
    description: string;
    image: string;
    linkTo?: string;
}

export interface IExpertiseListCacheJob {
    type: "list";
    version: number;
    page: number;
    limit: number;
}

export interface IExpertiseDetailsCacheJob {
    type: "details";
    expertiseId: string;
    version: number;
}

export type IExpertiseCacheJob =
    | IExpertiseListCacheJob
    | IExpertiseDetailsCacheJob;