import type { Request, Response } from "express";
import { contactModel } from "./contact.model.ts";

import {
  getCache,
  incrementCacheVersion,
  getCacheVersion,
  ContactCacheKeys,
  setCache,
} from "@utils";
import { CreateContactJob } from "./Contact.queue.ts";
import {
  sendInfoNotification,
  sendDangerNotification,
} from "@modules/Notification/Notification.service.ts";

export const createContact = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      name,
      email,
      mobile,
      message
    } = req.body;

    await CreateContactJob({
      name,
      email,
      mobile,
      message
    });

    return res.status(201).json({
      success: true,
      message: "Contact created successfully",
    });
  } catch (error) {
    await sendDangerNotification(
      "Contact Creation Failed",
      "Failed to create a contact."
    );

    return res.status(400).json({
      success: false,
      message: error,
    });
  }
};

export const GetContact = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const version = await getCacheVersion(
      ContactCacheKeys.listVersion()
    );

    const cacheKey = ContactCacheKeys.list(
      version,
      page,
      limit
    );

    const cachedContacts = await getCache(
      cacheKey
    );

    if (cachedContacts) {
      return res.status(200).json({
        success: true,
        data: cachedContacts,
      });
    }

    const skip = (page - 1) * limit;

    const contacts = await contactModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    await setCache(
      cacheKey,
      contacts,
      60 * 60
    );
    
    return res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error,
    });
  }
};

export const UpdateContactStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { status, _id } = req.body;

    const contact = await contactModel.findByIdAndUpdate(
      _id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

     await incrementCacheVersion(
      ContactCacheKeys.listVersion()
    );

    await sendInfoNotification(
      "Contact Status Updated",
      `Contact status changed to ${status}.`
    );

    return res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    await sendDangerNotification(
      "Contact Update Failed",
      "Failed to update contact status."
    );

    return res.status(400).json({
      success: false,
      message: error,
    });
  }
};

export const DeleteContact = async (
  req: Request,
  res: Response
) => {
  try {
    const { _id } = req.params;

    const contact =
      await contactModel.findByIdAndDelete(_id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

   await incrementCacheVersion(
      ContactCacheKeys.listVersion()
    );

    await sendInfoNotification(
      "Contact Deleted",
      "Contact has been deleted successfully."
    );

    return res.status(200).json({
      success: true,
      message: "Contact Deleted successfully",
    });
  } catch (error) {
    await sendDangerNotification(
      "Contact Deletion Failed",
      "Failed to delete contact."
    );

    return res.status(400).json({
      success: false,
      message: error,
    });
  }
};