type ProjectDetail = {
	data: {
		_id: string;
		title: string;
		createdAt: string;
		image: string;
		difficult?: string;
		subtitle?: string;
		content?: string;
	};
};

export type { ProjectDetail };
