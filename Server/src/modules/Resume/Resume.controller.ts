import { CVmodel } from "./Resume.model.ts";
import {
    Get_Signed_Url,
    getUploadedFile,
    uploadFileToS3,
    logger,
} from "@utils";
import type { Request, Response } from "express";
import {
    addCreateResumeJob,
    addUpdateResumeJob,
} from "./Resume.queue.ts";

export const AddCV = async (
    req: Request,
    res: Response
) => {
    try {
        const file = getUploadedFile(req);

        if (!file) {
            await logger.warn("AddCV missing file", { context: "ResumeController" });
            return res.status(400).json({
                success: false,
                message: "CV file is required",
            });
        }

        const uploadedFile = await uploadFileToS3({
            buffer: file.buffer,
            fileName: file.originalname,
            fileType: file.mimetype,
            folderType: "Resume",
        });

        const job = await addCreateResumeJob({
            CV: uploadedFile.key,
        });

        await logger.info("CV creation job added successfully", {
            context: "ResumeController",
            metadata: { jobId: job.id },
        });

        return res.status(202).json({
            success: true,
            message: "CV creation job added successfully",
            jobId: job.id,
        });
    } catch (error) {
        await logger.error(
            "AddCV error",
            error instanceof Error ? error : { context: "ResumeController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const UpdateCV = async (
    req: Request,
    res: Response
) => {
    try {
        const { _id } = req.body as {
            _id: string;
        };

        const file = getUploadedFile(req);

        if (!_id) {
            await logger.warn("UpdateCV missing _id", { context: "ResumeController" });
            return res.status(400).json({
                success: false,
                message: "_id is required",
            });
        }

        if (!file) {
            await logger.warn("UpdateCV missing file", { context: "ResumeController" });
            return res.status(400).json({
                success: false,
                message: "CV file is required",
            });
        }

        const existingCV = await CVmodel.findById(_id);

        if (!existingCV) {
            await logger.warn(`UpdateCV: CV not found for ID: ${_id}`, { context: "ResumeController" });
            return res.status(404).json({
                success: false,
                message: "CV not found",
            });
        }

        const uploadedFile = await uploadFileToS3({
            buffer: file.buffer,
            fileName: file.originalname,
            fileType: file.mimetype,
            folderType: "Resume",
        });

        const job = await addUpdateResumeJob(
            _id,
            {
                CV: uploadedFile.key,
            }
        );

        await logger.info(`CV update queued for ID: ${_id}`, {
            context: "ResumeController",
            metadata: { jobId: job.id, resumeId: _id },
        });

        return res.status(202).json({
            success: true,
            message: "CV update job added successfully",
            jobId: job.id,
        });
    } catch (error) {
        await logger.error(
            "UpdateCV error",
            error instanceof Error ? error : { context: "ResumeController", metadata: { error: String(error) } }
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const GetCV = async (
    _req: Request,
    res: Response
) => {
    try {
        const cv = await CVmodel.findOne();

        if (!cv?.CV) {
            await logger.warn("GetCV: CV not found", { context: "ResumeController" });
            return res.status(404).json({
                success: false,
                message: "CV not found",
            });
        }

        const signedCv = await Get_Signed_Url({
            key: cv.CV,
        });

        await logger.info("Fetched CV signed URL", { context: "ResumeController" });

        return res.status(200).json({
            success: true,
            data: signedCv,
        });
    } catch (error) {
        await logger.error(
            "GetCV error",
            error instanceof Error ? error : { context: "ResumeController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};