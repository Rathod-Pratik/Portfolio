import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { incrementCacheVersion, setCache, logger } from "@utils";
import { contactModel } from "./Contact.model.ts";
import {
    ContactCacheKeys,
} from "@utils";
import type { ICreateContactJob } from "./Contact.queue.ts";
import { sendInfoNotification } from "@modules/Notification/Notification.index.ts";
import nodemailer from "nodemailer";

export const contactWorker = new Worker<ICreateContactJob>(
    "contact",
    async (job) => {
        const { name, email, mobile, message } = job.data;

        const contact = await contactModel.create({
            name,
            email,
            mobile,
            message,
        });

        if (!contact) {
            await logger.error("Failed to create contact in database", { context: "ContactWorker" });
            throw new Error("Failed to create contact");
        }

        await incrementCacheVersion(
            ContactCacheKeys.listVersion()
        );

        await sendInfoNotification(
            "New Contact",
            `New contact received from ${name}.`
        );

        await logger.info(`Contact created with ID: ${contact._id.toString()}`, {
            context: "ContactWorker",
            metadata: { contactId: contact._id.toString(), email, jobId: job.id },
        });

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
                    Message: ${message}`,
        };

        await auth.sendMail(receiver);
        await logger.info(`Contact notification email sent for ${email}`, { context: "ContactWorker" });
    },
    {
        connection: bellmqConnection,
        skipVersionCheck: true,
        concurrency: 1,
    }
);

contactWorker.on("completed", (job) => {
    logger.info(`Contact job completed: ${job.id}`, { context: "ContactWorker", metadata: { jobId: job.id } });
});

contactWorker.on("failed", (job, error) => {
    logger.error(
        `Contact job failed: ${job?.id}`,
        error instanceof Error ? error : { context: "ContactWorker", metadata: { jobId: job?.id, error: String(error) } }
    );
});

contactWorker.on("error", (error) => {
    logger.error(
        "Contact worker error",
        error instanceof Error ? error : { context: "ContactWorker", metadata: { error: String(error) } }
    );
});
