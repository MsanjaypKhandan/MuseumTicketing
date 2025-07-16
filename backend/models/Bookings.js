import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    museum: {
      type: mongoose.Types.ObjectId,
      ref: "Museum",
      required: true,
    },
    slot: {
      type: mongoose.Types.ObjectId,
      ref: "Slot",
    },
    date: {
      type: Date,
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    // One-time-use ticket guard: set atomically on first successful scan.
    // A second scan finds usedAt already populated and is rejected.
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1 });
bookingSchema.index({ museum: 1, date: 1 });
bookingSchema.index({ slot: 1 });

export default mongoose.model("Booking", bookingSchema);
