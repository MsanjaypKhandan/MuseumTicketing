import Slot from "../models/Slot.js";
import Museum from "../models/Museum.js";

/**
 * Slot service — owns slot creation and the atomic reserve/release
 * primitives that the booking and waitlist services build on.
 */

export const createSlot = async ({ museumId, date, startTime, endTime, capacity }) => {
  const museum = await Museum.findById(museumId);
  if (!museum) {
    const err = new Error("Museum not found");
    err.status = 404;
    throw err;
  }
  return Slot.create({ museum: museumId, date: new Date(date), startTime, endTime, capacity });
};

export const listSlots = async (museumId, date) => {
  const filter = { museum: museumId };
  if (date) {
    const day = new Date(date);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: day, $lt: next };
  }
  return Slot.find(filter).sort({ date: 1, startTime: 1 });
};

/**
 * Atomic reservation — the heart of overbooking prevention.
 *
 * The $expr guard "booked + count <= capacity" lives in the *query filter*,
 * so the conditional check and the $inc happen as one atomic document
 * update. Two concurrent reservations for the last seats cannot both
 * succeed: MongoDB serialises the updates, and the one that would breach
 * capacity matches no document and returns null. No read-then-write race.
 *
 * Runs inside the caller's transaction (session) so it commits or rolls
 * back with the booking insert.
 */
export const reserveCapacity = async (slotId, count, session) => {
  return Slot.findOneAndUpdate(
    {
      _id: slotId,
      $expr: { $lte: [{ $add: ["$booked", count] }, "$capacity"] },
    },
    { $inc: { booked: count } },
    { new: true, session }
  );
};

/**
 * Release capacity (on cancellation). Clamped at 0 via the booked filter so
 * a double-release can't drive the counter negative.
 */
export const releaseCapacity = async (slotId, count, session) => {
  return Slot.findOneAndUpdate(
    { _id: slotId, booked: { $gte: count } },
    { $inc: { booked: -count } },
    { new: true, session }
  );
};
