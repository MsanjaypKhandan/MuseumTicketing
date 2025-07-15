import mongoose from "mongoose";

/**
 * Transactional Outbox.
 *
 * The dual-write problem: a booking commit and "publish an event" cannot be
 * one atomic action across MongoDB and an external broker. If we committed
 * the booking then crashed before publishing, the event would be lost.
 *
 * Solution: write the event into this collection *inside the same
 * transaction* as the business write. A separate dispatcher then reads
 * unpublished rows and publishes them to the event bus, marking each
 * published. The business write and the event record commit or roll back
 * together — at-least-once delivery with no lost events.
 *
 * `status` + `createdAt` index drives the dispatcher's polling query.
 */
const outboxSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "published", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

outboxSchema.index({ status: 1, createdAt: 1 });

export default mongoose.model("OutboxEvent", outboxSchema);
