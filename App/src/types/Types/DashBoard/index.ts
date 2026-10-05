

export interface ExpertiseItem {
    _id?: string;
    title: string;
    description: string;
    image: string;
}

export interface ExpertiseFormData {
    _id?: string;
    title: string;
    description: string;
    image: string;
    imageFile?: File | null;
}

export interface ExperienceItem {
    _id?: string;
    year: string;
    duration: string;
    title: string;
    company: string;
    description: string;
}

export interface ExperienceFormData {
    _id?: string;
    year: string;
    duration: string;
    title: string;
    company: string;
    description: string;
}

export interface DashboardStatsResponse {
    BlogLength: number;
    ProjectLength: number;
    NoteLength: number;
    ContactLength: number;
    SkillLength: number;
    AdminView: number;
}

export interface DataStat {
    label: string;
    value: number;
}
