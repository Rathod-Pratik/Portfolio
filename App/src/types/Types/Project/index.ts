type ProjectDifficulty = "Easy" | "Medium" | "Hard";
type ProjectDifficultyOption = "" | ProjectDifficulty;

type ProjectItem = {
	_id: string;
	title: string;
	subtitle: string;
	image: string;
	difficult?: ProjectDifficulty;
};

type ProjectFormData = {
	_id?: string;
	title: string;
	subtitle: string;
	techStack: string[];
	description: string;
	liveDemoLink: string;
	images: string;
	imageFile: File | null;
	features: string[];
	difficult: ProjectDifficultyOption;
};

type CreateOrUpdateProjectPayload = {
	_id?: string;
	title: string;
	subtitle: string;
	images: string;
	difficult: ProjectDifficultyOption;
};

type ProjectCardProps = {
	item: ProjectItem;
};

type GetProjectsResponse = {
	success: boolean;
	data: ProjectItem[];
};

type GetProjectResponse = {
	success: boolean;
	data: ProjectItem & {
		createdAt: string;
		content?: string;
	};
};

export type {
	ProjectDifficulty,
	ProjectDifficultyOption,
	ProjectItem,
	ProjectFormData,
	CreateOrUpdateProjectPayload,
	ProjectCardProps,
	GetProjectsResponse,
	GetProjectResponse,
};
