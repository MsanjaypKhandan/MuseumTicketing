import * as notificationService from "../services/notificationService.js";

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.listNotifications(req.params.userId, {
      unreadOnly: req.query.unread === "true",
    });
    return res.status(200).json({ notifications });
  } catch (err) {
    return next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.params.userId, req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    return res.status(200).json({ notification });
  } catch (err) {
    return next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const count = await notificationService.markAllRead(req.params.userId);
    return res.status(200).json({ message: `Marked ${count} as read` });
  } catch (err) {
    return next(err);
  }
};
