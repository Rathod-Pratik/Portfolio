import express from "express";
import {
    CreateNote,
    DeleteNote,
    EditNote,
    GetNote,
    GetNoteById,
} from "./Note.controller.ts";
import { checkAdminCookie } from "@Middleware/Auth.middleware.ts";
import { updateAdminViews } from "@Middleware/View.middleware.ts";
import { uploadFiles } from "@Middleware/multer.middleware.ts";

const router = express.Router();

router.get(
    "/getnotes",
    updateAdminViews,
    GetNote,
);

router.get(
    "/getnotes/:_id",
    updateAdminViews,
    GetNoteById,
);

router.post(
    "/createNote",
    uploadFiles,
    checkAdminCookie,
    CreateNote,
);

router.put(
    "/editNote",
    uploadFiles,
    checkAdminCookie,
    EditNote,
);

router.delete(
    "/deleteNote/:_id",
    checkAdminCookie,
    DeleteNote,
);

export default router;