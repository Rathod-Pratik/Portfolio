import express from "express";
import { checkAdminCookie } from "@Middleware/Auth.middleware.ts";
import {
    getNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} from "./Notification.controller.ts";

const router = express.Router();

router.get("/", checkAdminCookie, getNotifications);
router.get("/:id", checkAdminCookie, getNotificationById);
router.put("/read-all", checkAdminCookie, markAllAsRead);
router.put("/:id/read", checkAdminCookie, markAsRead);
router.delete("/all", checkAdminCookie, clearAllNotifications);
router.delete("/:id", checkAdminCookie, deleteNotification);

export default router;
