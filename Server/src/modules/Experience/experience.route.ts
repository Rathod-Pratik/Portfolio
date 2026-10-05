import express from "express";
import {
    createExperience,
    getExperiences,
    getExperienceById,
    updateExperience,
    deleteExperience,
} from "./experience.controller.ts";
import { checkAdminCookie } from "@Middleware/Auth.middleware.ts";
import { Validate } from "@Middleware/Validation.middleware.ts";
import {
    CreateExperienceSchema,
    UpdateExperienceSchema,
    ExperienceIdSchema,
} from "./Experience.validation.ts";

const router = express.Router();

router.post(
    "/",
    checkAdminCookie,
    Validate(CreateExperienceSchema),
    createExperience
);

router.get(
    "/",
    getExperiences
);

router.get(
    "/:id",
    Validate(ExperienceIdSchema),
    getExperienceById
);

router.put(
    "/:id",
    checkAdminCookie,
    Validate(ExperienceIdSchema),
    Validate(UpdateExperienceSchema),
    updateExperience
);

router.delete(
    "/:id",
    checkAdminCookie,
    Validate(ExperienceIdSchema),
    deleteExperience
);

export default router;