import express from "express";
import { listNotifications, markRead, markAllRead } from "../controllers/notification-controller.js";

const notificationRouter = express.Router();

notificationRouter.get("/user/:userId", listNotifications);
notificationRouter.patch("/user/:userId/read-all", markAllRead);
notificationRouter.patch("/user/:userId/:id/read", markRead);

export default notificationRouter;
