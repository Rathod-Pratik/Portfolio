import express from "express";
import { getAbout, updateAbout } from './About.controller.ts';
import { checkAdminCookie } from '@Middleware/Auth.middleware.ts';
import { Validate } from "@Middleware/Validation.middleware.ts";
import { AboutSchema } from "./About.validation.ts";

const router = express.Router();

router.get("/", getAbout);
router.put("/", checkAdminCookie, Validate(AboutSchema), updateAbout);

export default router;
