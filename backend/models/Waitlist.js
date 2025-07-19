import mongoose from "mongoose";

/**
 * FIFO waitlist entry for a full slot.
 *
 * Ordering is by createdAt — the oldest WAITING entry that fits the freed
 * capacity is promoted first when a booking is cancelled. The compound
 * index { slot, status, createdAt } makes "next in line for this slot" an
 * indexed sort rather than a scan.
 */
const waitlistSchema = new mongoose.Schema(
  {
    slot: { type: mongoose.Types.ObjectId, ref: "Slot", required: true },
    museum: { type: mongoose.Types.ObjectId, ref: "Museum", required: true },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    count: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["waiting", "promoted", "expired"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

waitlistSchema.index({ slot: 1, status: 1, createdAt: 1 });

export default mongoose.model("Waitlist", waitlistSchema);
