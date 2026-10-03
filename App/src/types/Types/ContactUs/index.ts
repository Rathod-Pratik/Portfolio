type ContactUsItem = {
	_id: string;
	name: string;
	email: string;
	mobile: string;
	projectType: string;
	budget: string;
	status: "new" | "contacted" | "inProgress" | "closed";
	message: string;
	createdAt?: string;
	updatedAt?: string;
};

type ContactFormOptions = {
	projectTypes: string[];
	budgets: string[];
};

type GetContactResponse = {
	success: boolean;
	data: ContactUsItem[];
	source?: "cache" | "database";
};

type GetContactFormOptionsResponse = {
	success: boolean;
	data: ContactFormOptions;
};

export type { ContactUsItem, ContactFormOptions, GetContactFormOptionsResponse, GetContactResponse };
