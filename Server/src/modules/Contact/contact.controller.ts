import type { Request, Response } from "express";
import { contactModel } from "./contact.model.ts";
import nodemailer from "nodemailer";
import {
  getCache,
  incrementCacheVersion,
  getCacheVersion,
  ContactCacheKeys,
} from "@utils";
import { addContactCacheJob } from "./Contact.queue.ts";
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
      projectType,
      budget,
      message,
      status,
    } = req.body;

    const contact = await contactModel.create({
      name,
      email,
      mobile,
      projectType,
      budget,
      status: status || "new",
      message,
    });

    await incrementCacheVersion(
      ContactCacheKeys.listVersion()
    );

    await addContactCacheJob(
      await getCacheVersion(
        ContactCacheKeys.listVersion()
      ),
      1,
      10
    );

    await sendInfoNotification(
      "New Contact",
      `New contact received from ${name}.`
    );

    const auth = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const receiver = {
      from: email,
      to: process.env.MAIL_USER,
      subject: "Email from your Portfolio",
      text: `Name: ${name}
Email: ${email}
Phone: ${mobile}
Project Type: ${projectType}
Budget: ${budget}
Message: ${message}`,
    };

    await auth.sendMail(receiver);

    return res.status(201).json({
      success: true,
      data: contact,
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

    await addContactCacheJob(
      version,
      page,
      limit
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
    const { _id } = req.params;
    const { status } = req.body;

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

    const version = await incrementCacheVersion(
      ContactCacheKeys.listVersion()
    );

    await addContactCacheJob(
      version,
      1,
      10
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

    const version = await incrementCacheVersion(
      ContactCacheKeys.listVersion()
    );

    await addContactCacheJob(
      version,
      1,
      10
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