import mongoose from "mongoose";

/**
 * A bookable time slot for a museum on a given date.
 *
 * `capacity` is fixed; `booked` is incremented atomically as tickets are
 * reserved. The (museum, date, startTime) unique index prevents duplicate
 * slots and the { museum, date } index serves the slot-listing query.
 *
 * Occupancy analytics derive from booked/capacity, which is why we track
 * `booked` rather than a decrementing `available` counter.
 */
const slotSchema = new mongoose.Schema(
  {
    museum: { type: mongoose.Types.ObjectId, ref: "Museum", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },    // "11:00"
    capacity: { type: Number, required: true, min: 1 },
    booked: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

slotSchema.index({ museum: 1, date: 1, startTime: 1 }, { unique: true });
slotSchema.index({ museum: 1, date: 1 });

slotSchema.virtual("available").get(function () {
  return this.capacity - this.booked;
});

slotSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Slot", slotSchema);
