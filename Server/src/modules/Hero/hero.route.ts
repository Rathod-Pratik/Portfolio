import express from "express";
import {
    getHero,
    updateHero,
} from "./Hero.controller.ts";
import { checkAdminCookie } from "@Middleware/Auth.middleware.ts";
import { uploadFiles } from "@Middleware/multer.middleware.ts";
import { Validate } from "@Middleware/Validation.middleware.ts";
import { UpdateHeroSchema } from "./Hero.validation.ts";

const router = express.Router();

router.get(
    "/",
    getHero
);

router.put(
    "/",
    uploadFiles,
    checkAdminCookie,
    Validate(UpdateHeroSchema),
    updateHero
);

export default router;