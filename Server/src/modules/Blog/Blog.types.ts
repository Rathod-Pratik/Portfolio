export interface IBlog {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    tags: string[];
    author: string;
    isPublished: boolean;
    isDeleted?: boolean;
}