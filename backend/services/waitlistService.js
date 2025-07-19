import Waitlist from "../models/Waitlist.js";
import Slot from "../models/Slot.js";
import Booking from "../models/Bookings.js";
import Museum from "../models/Museum.js";
import User from "../models/User.js";
import OutboxEvent from "../models/OutboxEvent.js";
import { withTransaction } from "../config/db.js";
import { reserveCapacity } from "./slotService.js";
import { drainOutbox } from "../events/dispatcher.js";
import { EventTypes } from "../events/eventTypes.js";

export const joinWaitlist = async ({ slotId, userId, count }) => {
  const slot = await Slot.findById(slotId);
  if (!slot) {
    const err = new Error("Slot not found");
    err.status = 404;
    throw err;
  }

  const entry = await withTransaction(async (session) => {
    const [created] = await Waitlist.create(
      [{ slot: slotId, museum: slot.museum, user: userId, count, status: "waiting" }],
      { session }
    );
    await OutboxEvent.create(
      [{
        type: EventTypes.WAITLIST_JOINED,
        payload: { waitlistId: String(created._id), userId: String(userId), slotId: String(slotId), museumId: String(slot.museum), count },
      }],
      { session }
    );
    return created;
  });

  drainOutbox().catch(() => {});
  return entry;
};

/**
 * Promote the next eligible waitlist entry for a slot.
 *
 * Triggered by the BOOKING_CANCELLED event (freed capacity). Walks WAITING
 * entries oldest-first (FIFO) and promotes the first one that fits the
 * currently available capacity. The promotion reuses the same atomic
 * reserveCapacity guard, so it is safe against a concurrent fresh booking
 * grabbing the freed seats — whoever loses the atomic update simply isn't
 * promoted this round.
 */
export const promoteNextForSlot = async (slotId) => {
  const candidates = await Waitlist.find({ slot: slotId, status: "waiting" }).sort({ createdAt: 1 });

  for (const candidate of candidates) {
    const promoted = await withTransaction(async (session) => {
      const slot = await reserveCapacity(slotId, candidate.count, session);
      if (!slot) return null; // can't fit this candidate right now

      const entry = await Waitlist.findOneAndUpdate(
        { _id: candidate._id, status: "waiting" },
        { $set: { status: "promoted" } },
        { new: true, session }
      );
      if (!entry) return null; // someone else promoted it; release happens via abort

      const [booking] = await Booking.create(
        [{
          museum: slot.museum,
          slot: slot._id,
          date: slot.date,
          user: candidate.user,
          count: candidate.count,
          status: "confirmed",
        }],
        { session }
      );

      await Museum.findByIdAndUpdate(slot.museum, { $push: { bookings: booking._id } }, { session });
      await User.findByIdAndUpdate(candidate.user, { $push: { bookings: booking._id } }, { session });

      await OutboxEvent.create(
        [{
          type: EventTypes.WAITLIST_PROMOTED,
          payload: {
            waitlistId: String(candidate._id),
            bookingId: String(booking._id),
            userId: String(candidate.user),
            slotId: String(slot._id),
            museumId: String(slot.museum),
            count: candidate.count,
          },
        }],
        { session }
      );

      return booking;
    });

    if (promoted) {
      drainOutbox().catch(() => {});
      return promoted; // promote one per freed booking
    }
  }
  return null;
};

export const listWaitlistForUser = async (userId) => {
  return Waitlist.find({ user: userId }).populate("slot museum").sort({ createdAt: -1 });
};
