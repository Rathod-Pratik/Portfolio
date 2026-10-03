export const createCacheKeys = (module: string) => {

    return {

        listVersion: () =>
            `${module}:list:version`,

        list: (
            version: number,
            page: number,
            limit: number,
            id?: string
        ) =>
            `${module}:list:${version}:${id || 'all'}:page:${page}:limit:${limit}`,

        detailsVersion: (
            id: string
        ) =>
            `${module}:details:version:${id}`,

        details: (
            id: string,
            version: number
        ) =>
            `${module}:details:${version}:${id}`,
    };
};


export const BlogCacheKeys =
    createCacheKeys("blog");

export const AboutCacheKeys =
    createCacheKeys("about");

export const AuthCacheKeys =
    createCacheKeys("auth");

export const ContactCacheKeys =
    createCacheKeys("contact");

export const ResumeCacheKeys = createCacheKeys("resume");

export const ProjectCacheKeys = createCacheKeys("project");

export const OtpCacheKeys =
    createCacheKeys("otp");

export const ContentCacheKeys =
    createCacheKeys("content");

export const ExperienceCacheKeys =
    createCacheKeys("experience");

export const NotificationCacheKeys =
    createCacheKeys("notification");

export const ExpertiseCacheKeys =
    createCacheKeys("expertise");

export const SkillCacheKeys = createCacheKeys("skill");

export const HeroCacheKeys =
    createCacheKeys("hero");

export const HERO_ID =
    "hero-id";

export const NoteCacheKeys =
    createCacheKeys("note");

export const LoggerCacheKeys =
    createCacheKeys("logger");