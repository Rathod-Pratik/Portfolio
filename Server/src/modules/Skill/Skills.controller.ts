import { SkillsModel } from "./Skills.model.ts";
import type { Request, Response } from "express";
import {
    CreateSkillSchema,
    EditSkillSchema,
} from "./Skills.validation.ts";
import {
    addCreateSkillJob,
    addUpdateSkillJob,
} from "./Skills.queue.ts";
import {
    getCache,
    setCache,
    SkillCacheKeys,
    getCacheVersion,
    incrementCacheVersion,
} from "@utils";
import {
    sendInfoNotification,
} from "../Notification/Notification.service.ts";


export const CreateSkill = async (
    req: Request,
    res: Response
) => {
    const validation = CreateSkillSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors,
        });
    }

    try {
        const job = await addCreateSkillJob(
            validation.data
        );

        await sendInfoNotification(
            "Skill creation queued",
            `Skill "${validation.data.language}" has been added to the creation queue.`
        );

        return res.status(202).json({
            success: true,
            message: "Skill creation job added successfully",
            jobId: job.id,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const EditSkill = async (
    req: Request,
    res: Response
) => {
    const validation = EditSkillSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors,
        });
    }

    try {
        const {
            _id,
            language,
            color,
            percentage,
        } = validation.data;

        const existingSkill =
            await SkillsModel.findById(_id);

        if (!existingSkill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }

        const updateData: Record<string, string | number> = {};

        if (language) updateData.language = language;

        if (color) updateData.color = color;

        if (percentage) updateData.percentage = percentage;


        const job = await addUpdateSkillJob(
            _id,
            updateData
        );

        await sendInfoNotification(
            "Skill update queued",
            `Skill "${existingSkill.language}" has been added to the update queue.`
        );

        return res.status(202).json({
            success: true,
            message: "Skill update job added successfully",
            jobId: job.id,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const DeleteSkill = async (
    req: Request,
    res: Response
) => {
    try {
        const { _id } = req.params;

        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "_id is required",
            });
        }

        const skill =
            await SkillsModel.findByIdAndDelete(_id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }

        await incrementCacheVersion(
            SkillCacheKeys.listVersion()
        );

        await incrementCacheVersion(
            SkillCacheKeys.detailsVersion(_id as string)
        );

        return res.status(200).json({
            success: true,
            message: "Skill deleted successfully",
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const GetSkill = async (
    req: Request,
    res: Response
) => {
    try {
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 10;

        if (page < 1) {
            page = 1;
        }

        if (limit < 1) {
            limit = 10;
        }

        if (limit > 100) {
            limit = 100;
        }

        const version = await getCacheVersion(
            SkillCacheKeys.listVersion()
        );

        const cacheKey = SkillCacheKeys.list(
            version,
            page,
            limit
        );

        const cachedSkills =
            await getCache(cacheKey);

        if (cachedSkills !== null) {
            return res.status(200).json({
                success: true,
                data: cachedSkills,
            });
        }

        const skills = await SkillsModel.find()
            .limit(limit)
            .skip((page - 1) * limit);

        await setCache(
            cacheKey,
            skills
        );

        return res.status(200).json({
            success: true,
            data: skills,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
};