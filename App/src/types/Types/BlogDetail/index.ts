type BlogDetail = {
	_id: string;
	title: string;
	coverImage?: string;
	image?: string;
	author?: string;
	createdAt?: string;
	excerpt?: string;
	tags?: string[];
	content?: string;
	slug?: string;
};

type BlogListItem = {
	_id: string;
	title: string;
	coverImage?: string;
	slug?: string;
};

export type { BlogDetail, BlogListItem };
