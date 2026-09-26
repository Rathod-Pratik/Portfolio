import express from "express";
import {
    createExpertise,
    getExpertise,
    getExpertiseById,
    updateExpertise,
    deleteExpertise,
} from "./Expertise.controller.ts";
import { checkAdminCookie } from "@Middleware/Auth.middleware.ts";
import { uploadFiles } from "@Middleware/multer.middleware.ts";
import { Validate } from "@Middleware/Validation.middleware.ts";
import {
    CreateExpertiseSchema,
    UpdateExpertiseSchema,
    ExpertiseIdSchema,
} from "./Expertise.validation.ts";

const router = express.Router();

router.post(
    "/",
    uploadFiles,
    checkAdminCookie,
    Validate(CreateExpertiseSchema),
    createExpertise
);

router.get(
    "/",
    getExpertise
);

router.get(
    "/:id",
    Validate(ExpertiseIdSchema),
    getExpertiseById
);

router.put(
    "/:id",
    uploadFiles,
    checkAdminCookie,
    Validate(UpdateExpertiseSchema),
    updateExpertise
);

router.delete(
    "/:id",
    checkAdminCookie,
    Validate(ExpertiseIdSchema),
    deleteExpertise
);

export default router;