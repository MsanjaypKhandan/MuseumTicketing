import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";
import { logger } from "../middleware/logger.js";

/**
 * Notification service — the single place that turns a domain intent into
 * a persisted in-app notification plus optional out-of-band channels
 * (email). Subscribers call this; controllers never touch notifications
 * directly.
 */
export const notify = async ({ userId, type, title, message, channels = ["in_app"], metadata = {} }) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    channels,
    metadata,
  });

  if (channels.includes("email")) {
    // Email is best-effort and must never fail the notification write.
    try {
      const user = await User.findById(userId);
      if (user?.email) {
        await sendMail({ to: user.email, subject: title, text: message });
      }
    } catch (err) {
      logger.error("notification.email_failed", { userId: String(userId), message: err.message });
    }
  }

  return notification;
};

export const listNotifications = async (userId, { unreadOnly = false } = {}) => {
  const filter = { user: userId };
  if (unreadOnly) filter.read = false;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(50);
};

export const markRead = async (userId, notificationId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { read: true } },
    { new: true }
  );
};

export const markAllRead = async (userId) => {
  const res = await Notification.updateMany(
    { user: userId, read: false },
    { $set: { read: true } }
  );
  return res.modifiedCount;
};
