import { SkillsModel } from "./skills.model.ts";
import type { Request, Response } from "express";
import {
    CreateSkillSchema,
    EditSkillSchema,
} from "./Skill.validation.ts";
import {
    addCreateSkillJob,
    addUpdateSkillJob,
} from "./Skill.queue.ts";
import {
    getCache,
    setCache,
    SkillCacheKeys,
    getCacheVersion,
    incrementCacheVersion,
    logger,
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
        await logger.warn("Create skill validation failed", {
            context: "SkillController",
            metadata: { errors: validation.error.flatten().fieldErrors },
        });
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

        await logger.info(`Skill creation queued: ${validation.data.language}`, {
            context: "SkillController",
            metadata: { jobId: job.id, skill: validation.data.language },
        });

        return res.status(202).json({
            success: true,
            message: "Skill creation job added successfully",
            jobId: job.id,
        });
    } catch (error) {
        await logger.error(
            "Create skill error",
            error instanceof Error ? error : { context: "SkillController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
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
        await logger.warn("Edit skill validation failed", {
            context: "SkillController",
            metadata: { errors: validation.error.flatten().fieldErrors },
        });
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
            await logger.warn(`Edit skill: Skill not found with ID: ${_id}`, { context: "SkillController" });
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

        await logger.info(`Skill update queued for ID: ${_id}`, {
            context: "SkillController",
            metadata: { jobId: job.id, skillId: _id },
        });

        return res.status(202).json({
            success: true,
            message: "Skill update job added successfully",
            jobId: job.id,
        });
    } catch (error) {
        await logger.error(
            "Edit skill error",
            error instanceof Error ? error : { context: "SkillController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
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
            await logger.warn("Delete skill missing _id param", { context: "SkillController" });
            return res.status(400).json({
                success: false,
                message: "_id is required",
            });
        }

        const skill =
            await SkillsModel.findByIdAndDelete(_id);

        if (!skill) {
            await logger.warn(`Delete skill: Not found for ID: ${_id}`, { context: "SkillController" });
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

        await logger.info(`Skill deleted successfully: ${skill.language} (ID: ${_id})`, { context: "SkillController" });

        return res.status(200).json({
            success: true,
            message: "Skill deleted successfully",
        });
    } catch (error) {
        await logger.error(
            "Delete skill error",
            error instanceof Error ? error : { context: "SkillController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
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
            await logger.debug("Fetched skills from cache", { context: "SkillController" });
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

        await logger.info(`Fetched ${skills.length} skills from database`, { context: "SkillController" });

        return res.status(200).json({
            success: true,
            data: skills,
        });
    } catch (error) {
        await logger.error(
            "GetSkill error",
            error instanceof Error ? error : { context: "SkillController", metadata: { error: String(error) } }
        );
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};
