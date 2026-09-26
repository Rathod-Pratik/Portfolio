import { Worker } from "bullmq";
import { bellmqConnection } from "@config/redis.ts";
import { incrementCacheVersion, setCache } from "@utils";
import { contactModel } from "./contact.model.ts";
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
            throw new Error("Failed to create contact");
        }

        await incrementCacheVersion(
            ContactCacheKeys.listVersion()
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
                    Message: ${message}`,
        };

        await auth.sendMail(receiver);
    },
    {
        connection: bellmqConnection,
        concurrency: 1,
    }
);

contactWorker.on("completed", (job) => {
    console.log(
        `Contact cache job completed: ${job.id}`
    );
});

contactWorker.on("failed", (job, error) => {
    console.error(
        `Contact cache job failed: ${job?.id}`,
        error
    );
});

contactWorker.on("error", (error) => {
    console.error(
        "Contact worker error:",
        error
    );
});