type ResumeItem = {
	_id?: string;
	CV?: string;
};

type GetResumeResponse = {
	success: boolean;
	data: string;
};

type CreateOrUpdateResumeResponse = {
	success: boolean;
	message: string;
	jobId: string;
};

type ResumeSignedUrlResponse = {
	url: string;
	fields: Record<string, string>;
	key: string;
};

export type {
	ResumeItem,
	GetResumeResponse,
	CreateOrUpdateResumeResponse,
	ResumeSignedUrlResponse,
};
