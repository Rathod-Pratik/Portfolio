import express from "express";
import {
    createContact,
    DeleteContact,
    GetContact,
    UpdateContactStatus,
} from "./Contact.controller.ts";
import { checkAdminCookie } from "@Middleware/Auth.middleware.ts";
import { updateAdminViews } from "@Middleware/View.middleware.ts";
import { Validate } from "@Middleware/Validation.middleware.ts";
import {
    CreateContactSchema,
    UpdateContactStatusSchema,
} from "./Contact.validation.ts";

const router = express.Router();

router.get(
    "/getcontact",
    checkAdminCookie,
    GetContact
);

router.post(
    "/createcontact",
    updateAdminViews,
    Validate(CreateContactSchema),
    createContact
);

router.put(
    "/updatecontactstatus/:_id",
    checkAdminCookie,
    Validate(UpdateContactStatusSchema),
    UpdateContactStatus
);

router.delete(
    "/deletecontact/:_id",
    checkAdminCookie,
    DeleteContact
);

export default router;