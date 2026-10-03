type NoteItem = {
	_id?: string;
	title: string;
	description: string;
	note_image_url?: string;
	imageUrl?: string;
	note_pdf_url?: string;
	fileUrl?: string;
	pdfUrl?: string;
	createdAt?: string;
	updatedAt?: string;
};

type NoteFormData = {
	_id: string | null;
	title: string;
	description: string;
	imageFile: File | null;
	note_image_url: string;
	note_pdf_url: string;
	pdfFile: File | null;
};

type NoteCardProps = {
	item: NoteItem;
};

type GetNotesResponse = {
	success: boolean;
	data: {
		notes: NoteItem[];
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
	source: "cache" | "database";
};

type GetNoteResponse = {
	success: boolean;
	data: NoteItem;
	source: "cache" | "database";
};

export type { NoteItem, NoteFormData, NoteCardProps, GetNotesResponse, GetNoteResponse };
