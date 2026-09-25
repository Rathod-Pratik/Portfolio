import express from "express";
import {
    createContact,
    DeleteContact,
    GetContact,
    UpdateContactStatus,
} from "./contact.controller.ts";
import { checkAdminCookie } from "../../middlewares/Auth.middleware.ts";
import { updateAdminViews } from "../../middlewares/View.middleware.ts";
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