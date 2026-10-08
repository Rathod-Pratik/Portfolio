import type { Request, Response } from "express";
import { contactModel } from "./Contact.model.ts";

import {
  logger,
} from "@utils";
import { CreateContactJob } from "./Contact.queue.ts";
import {
  sendInfoNotification,
  sendDangerNotification,
} from "@modules/Notification/Notification.service.ts";
import { ContactIdSchema, CreateContactSchema, UpdateContactStatusSchema } from "./Contact.validation.ts";

export const createContact = async (
  req: Request,
  res: Response,
) => {
  try {
    const validate = CreateContactSchema.safeParse(req.body);

    if (!validate.success) {
      await logger.warn("Create contact validation failed", {
        context: "ContactController",
        metadata: { errors: validate.error.issues },
      });
      return res.status(400).json({
        message: validate.error.issues,
      });
    }

    const {
      name,
      email,
      mobile,
      message
    } = validate.data;

    const job = await CreateContactJob({
      name,
      email,
      mobile,
      message
    });

    await logger.info(`Contact message queued from: ${name} (${email})`, {
      context: "ContactController",
      metadata: { jobId: job.id, email },
    });

    return res.status(201).json({
      success: true,
      message: "Contact created successfully",
    });
  } catch (error) {
    await logger.error(
      "Contact Creation Failed",
      error instanceof Error ? error : { context: "ContactController", metadata: { error: String(error) } }
    );
    await sendDangerNotification(
      "Contact Creation Failed",
      "Failed to create a contact."
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create contact",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const GetContact = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const contacts = await contactModel
      .find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    await logger.info(`Fetched ${contacts.length} contacts from database`, { context: "ContactController" });
    
    return res.status(200).json({
      success: true,
      data: contacts,
      source: "database",
    });
  } catch (error) {
    await logger.error(
      "GetContact error",
      error instanceof Error ? error : { context: "ContactController", metadata: { error: String(error) } }
    );
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const UpdateContactStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const validate = UpdateContactStatusSchema.safeParse(req.body);
    if (!validate.success) {
      await logger.warn("Update contact status validation failed", {
        context: "ContactController",
        metadata: { errors: validate.error.issues },
      });
      return res.status(400).json({
        message: validate.error.issues,
      });
    }
    
    const { status, _id } = validate.data;

    const contact = await contactModel.findByIdAndUpdate(
      _id,
      { status },
      { new: true }
    );

    if (!contact) {
      await logger.warn(`Update contact status: Contact not found with ID: ${_id}`, { context: "ContactController" });
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    await sendInfoNotification(
      "Contact Status Updated",
      `Contact status changed to ${status}.`
    );

    await logger.info(`Contact status updated for ${_id} to ${status}`, { context: "ContactController" });

    return res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    await logger.error(
      "Contact Update Failed",
      error instanceof Error ? error : { context: "ContactController", metadata: { error: String(error) } }
    );
    await sendDangerNotification(
      "Contact Update Failed",
      "Failed to update contact status."
    );

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const DeleteContact = async (
  req: Request,
  res: Response,
) => {
  try {
    const validate = ContactIdSchema.safeParse(req.params);

    if (!validate.success) {
      await logger.warn("Delete contact invalid params", {
        context: "ContactController",
        metadata: { errors: validate.error.issues },
      });
      return res.status(400).json({
        message: "Invalid request params",
        error: validate.error.issues,
      });
    }
    
    const { _id } = req.params;

    const contact =
      await contactModel.findByIdAndUpdate(_id, { isDeleted: true });

    if (!contact) {
      await logger.warn(`Delete contact: Contact not found with ID: ${_id}`, { context: "ContactController" });
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    await sendInfoNotification(
      "Contact Deleted",
      "Contact has been deleted successfully."
    );

    await logger.info(`Contact deleted for ID: ${_id}`, { context: "ContactController" });

    return res.status(200).json({
      success: true,
      message: "Contact Deleted successfully",
    });
  } catch (error) {
    await logger.error(
      "Contact Deletion Failed",
      error instanceof Error ? error : { context: "ContactController", metadata: { error: String(error) } }
    );
    await sendDangerNotification(
      "Contact Deletion Failed",
      "Failed to delete contact."
    );

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
