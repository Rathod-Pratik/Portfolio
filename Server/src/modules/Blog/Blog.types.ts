export interface IBlog {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    tags: string[];
    author: string;
    isPublished: boolean;
}