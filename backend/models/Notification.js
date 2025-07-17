import mongoose from "mongoose";

/**
 * A persisted in-app notification.
 *
 * Notifications are written by subscribers reacting to domain events, so
 * the read path (GET /notifications) never blocks on email/SMS delivery.
 * The { user, read, createdAt } index serves the common "my unread
 * notifications, newest first" query.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, // mirrors an EventType
    title: { type: String, required: true },
    message: { type: String, required: true },
    channels: [{ type: String, enum: ["in_app", "email"] }],
    read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
