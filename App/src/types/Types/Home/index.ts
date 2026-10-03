type Hero = {
  _id?: string;
  greeting: string;
  name: string;
  roles: string[];
  description: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
};

type HeroResponse = {
  data: Hero;
  source: "cache" | "database";
};

type Services = {
  data: {
    _id?: string;
    title: string;
    description: string;
    image: string;
  }[];
};

type ExpertiseResponse = {
  data: Services["data"];
  source: "cache" | "database";
};

type ExperienceItem = {
  _id?: string;
  year: string;
  duration: string;
  title: string;
  company: string;
  description: string;
};

type ExperienceResponse = {
  data: ExperienceItem[];
  source: "cache" | "database";
};

type ExperienceProps = {
  data: ExperienceItem[];
};

type SkillCardProps = {
  color: string;
  text: string;
  percentage: number | string;
};

type SkillItem = {
  language: string;
  percentage: number | string;
  color: string;
};

type ResumeFile = string | null;

type HeroProps = {
  data: Hero;
};

type ServicesProps = Services;

type SkillsProps = {
  data: SkillItem[];
  resumeFile: ResumeFile;
};

export type {
  Hero,
  HeroResponse,
  Services,
  SkillCardProps,
  SkillItem,
  ResumeFile,
  HeroProps,
  ServicesProps,
  ExpertiseResponse,
  ExperienceItem,
  ExperienceResponse,
  ExperienceProps,
  SkillsProps,
};