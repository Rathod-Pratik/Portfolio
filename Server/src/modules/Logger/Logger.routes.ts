import express from "express";
import { getLogs, getLogById, createLog, deleteLog, clearLogs } from "./Logger.controller.ts";
import { checkAdminCookie } from "@Middleware/Auth.middleware.ts";
import { Validate } from "@Middleware/Validation.middleware.ts";
import { CreateLoggerSchema } from "./Logger.validation.ts";

const router = express.Router();

router.get("/", checkAdminCookie, getLogs);
router.get("/:id", checkAdminCookie, getLogById);
router.post("/", Validate(CreateLoggerSchema), createLog);
router.delete("/all", checkAdminCookie, clearLogs);
router.delete("/:id", checkAdminCookie, deleteLog);

export default router;
