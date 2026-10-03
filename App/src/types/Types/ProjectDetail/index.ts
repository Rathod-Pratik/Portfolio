type ProjectDetail = {
	data: {
		_id: string;
		title: string;
		createdAt: string;
		images: string;
		image?: string;
		difficult?: string;
		subtitle?: string;
		description: string;
		techStack?: string[];
		features?: string[];
		liveDemoLink?: string;
	};
};

export type { ProjectDetail };
