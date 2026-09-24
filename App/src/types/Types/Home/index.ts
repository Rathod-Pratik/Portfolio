type Hero = {
  greeting: string;
  roles: string[];
  description: string;
  image: string;
};

type Services = {
  data: {
    _id?: string;
    title: string;
    description: string;
    image: string;
  }[];
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
  Services,
  SkillCardProps,
  SkillItem,
  ResumeFile,
  HeroProps,
  ServicesProps,
  SkillsProps,
};