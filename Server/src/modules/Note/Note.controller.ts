import type { Request, Response } from "express";
import { NoteModel } from "./Note.model.ts";
import {
    addCreateNoteJob,
    addUpdateNoteJob,
} from "./Note.queue.ts";
import {
    CreateNoteSchema,
    UpdateNoteSchema,
    NoteIdSchema,
} from "./Note.validation.ts";
import {
    Get_Signed_Url,
    getCache,
    getCacheVersion,
    setCache,
    uploadFileToS3,
    NoteCacheKeys,
    incrementCacheVersion
} from "@utils";
import { sendInfoNotification } from "../Notification/Notification.service.ts";

const getFiles = (req: Request) => {
    const files = req.files as
        | {
            file?: Express.Multer.File[];
            image?: Express.Multer.File[];
        }
        | undefined;

    return {
        image: files?.image?.[0],
        pdf: files?.file?.[0],
    };
};

export const CreateNote = async (
    req: Request,
    res: Response,
) => {
    try {
        const validation =
            CreateNoteSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message,
            });
        }

        const { title, description } =
            validation.data;

        const { image, pdf } = getFiles(req);

        if (!image || !pdf) {
            return res.status(400).json({
                success: false,
                message:
                    "Image and PDF files are required",
            });
        }

        const [uploadedImage, uploadedPdf] =
            await Promise.all([
                uploadFileToS3({
                    buffer: image.buffer,
                    fileName: image.originalname,
                    fileType: image.mimetype,
                    folderType: "Note",
                }),
                uploadFileToS3({
                    buffer: pdf.buffer,
                    fileName: pdf.originalname,
                    fileType: pdf.mimetype,
                    folderType: "Note",
                }),
            ]);

        const job = await addCreateNoteJob({
            title,
            description,
            note_image_url:
                uploadedImage.key,
            note_pdf_url:
                uploadedPdf.key,
        });

        await sendInfoNotification(
            "Note Created",
            `Note "${title}" was added to the queue and is being processed.`,
        );

        return res.status(202).json({
            success: true,
            message:
                "Note was added to the queue and is being processed.",
            jobId: job.id,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    }
};

export const GetNote = async (
    req: Request,
    res: Response,
) => {
    try {
        const page = Math.max(
            Number(req.query.page) || 1,
            1,
        );

        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 10,
                1,
            ),
            100,
        );

        const version =
            await getCacheVersion(
                NoteCacheKeys.listVersion(),
            );

        const cacheKey =
            NoteCacheKeys.list(
                version,
                page,
                limit,
            );

        const cached =
            await getCache(cacheKey);

        if (cached) {
            return res.status(200).json({
                success: true,
                data: cached,
            });
        }

        const skip = (page - 1) * limit;

        const [notes, total] =
            await Promise.all([
                NoteModel.find()
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                NoteModel.countDocuments(),
            ]);

        const data = await Promise.all(
            notes.map(async (note) => {
                const [image, pdf] =
                    await Promise.all([
                        note.note_image_url.startsWith(
                            "http",
                        )
                            ? note.note_image_url
                            : Get_Signed_Url({
                                key: note.note_image_url,
                            }),
                        note.note_pdf_url.startsWith(
                            "http",
                        )
                            ? note.note_pdf_url
                            : Get_Signed_Url({
                                key: note.note_pdf_url,
                            }),
                    ]);

                return {
                    ...note,
                    note_image_url: image,
                    note_pdf_url: pdf,
                };
            }),
        );

        const response = {
            notes: data,
            total,
            page,
            limit,
            totalPages: Math.ceil(
                total / limit,
            ),
        };

        await setCache(
            cacheKey,
            response,
            600,
        );

        return res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    }
};

export const GetNoteById = async (
    req: Request,
    res: Response,
) => {
    try {
        const validation =
            NoteIdSchema.safeParse(
                req.params,
            );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message,
            });
        }

        const { _id } = validation.data;

        const version =
            await getCacheVersion(
                NoteCacheKeys.detailsVersion(
                    _id,
                ),
            );

        const cacheKey =
            NoteCacheKeys.details(
                _id,
                version,
            );

        const cached =
            await getCache(cacheKey);

        if (cached) {
            return res.status(200).json({
                success: true,
                data: cached,
            });
        }

        const note =
            await NoteModel.findById(
                _id,
            ).lean();

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        const [image, pdf] =
            await Promise.all([
                note.note_image_url.startsWith(
                    "http",
                )
                    ? note.note_image_url
                    : Get_Signed_Url({
                        key: note.note_image_url,
                    }),
                note.note_pdf_url.startsWith(
                    "http",
                )
                    ? note.note_pdf_url
                    : Get_Signed_Url({
                        key: note.note_pdf_url,
                    }),
            ]);

        const data = {
            ...note,
            note_image_url: image,
            note_pdf_url: pdf,
        };

        await setCache(
            cacheKey,
            data,
            600,
        );

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    }
};

export const EditNote = async (
    req: Request,
    res: Response,
) => {
         const validation =
            UpdateNoteSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message,
            });
        }
    try {

        const {
            _id,
            title,
            description,
        } = req.body;

        const { image, pdf } =
            getFiles(req);

        const note =
            await NoteModel.findById(_id);

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        const updateData: Record<
            string,
            string
        > = {};

        if (title !== undefined) {
            updateData.title = title;
        }

        if (description !== undefined) {
            updateData.description =
                description;
        }

        if (pdf) {
            const uploadedPdf =
                await uploadFileToS3({
                    buffer: pdf.buffer,
                    fileName: pdf.originalname,
                    fileType: pdf.mimetype,
                    folderType: "Note",
                });

            updateData.note_pdf_url =
                uploadedPdf.key;
        }

        if (image) {
            const uploadedImage =
                await uploadFileToS3({
                    buffer: image.buffer,
                    fileName: image.originalname,
                    fileType: image.mimetype,
                    folderType: "Note",
                });

            updateData.note_image_url =
                uploadedImage.key;
        }

        const job =
            await addUpdateNoteJob(
                _id,
                updateData,
            );

        await sendInfoNotification(
            "Note Updated",
            `Note "${note.title}" was added to the queue and is being updated.`,
        );

        return res.status(202).json({
            success: true,
            message:
                "Note was added to the queue and is being updated.",
            jobId: job.id,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    }
};

export const DeleteNote = async (
    req: Request,
    res: Response,
) => {
    try {
        const validation =
            NoteIdSchema.safeParse(
                req.params,
            );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message,
            });
        }

        const { _id } = validation.data;

        const note =
            await NoteModel.findById(_id);

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        await NoteModel.findByIdAndDelete(
            _id,
        );

        await incrementCacheVersion(
            NoteCacheKeys.listVersion(),
        );

        await incrementCacheVersion(
            NoteCacheKeys.detailsVersion(
                _id,
            ),
        );

        await sendInfoNotification(
            "Note Deleted",
            `Note "${note.title}" was deleted successfully.`,
        );

        return res.status(200).json({
            success: true,
            message:
                "Note deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    }
};