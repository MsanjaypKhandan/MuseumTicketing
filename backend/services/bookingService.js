import mongoose from "mongoose";
import Booking from "../models/Bookings.js";
import Museum from "../models/Museum.js";
import User from "../models/User.js";
import Slot from "../models/Slot.js";
import OutboxEvent from "../models/OutboxEvent.js";
import { withTransaction } from "../config/db.js";
import { reserveCapacity, releaseCapacity } from "./slotService.js";
import { drainOutbox } from "../events/dispatcher.js";
import { EventTypes } from "../events/eventTypes.js";

/**
 * Booking service.
 *
 * createBooking and cancelBooking each run as a single transaction that
 * bundles the business write, the slot capacity change, and the outbox
 * event insert. Either everything commits or nothing does — the outbox row
 * can never diverge from the booking it describes.
 */

const SLOT_ALMOST_FULL_THRESHOLD = 0.9;

export const createBooking = async ({ slotId, userId, count }) => {
  if (!slotId || !userId || !count || count < 1) {
    const err = new Error("Invalid booking inputs");
    err.status = 422;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const booking = await withTransaction(async (session) => {
    // Atomic capacity guard — null means the slot can't fit this booking.
    const slot = await reserveCapacity(slotId, count, session);
    if (!slot) {
      const err = new Error("Slot is full");
      err.status = 409;
      err.code = "SLOT_FULL";
      throw err;
    }

    const [created] = await Booking.create(
      [{
        museum: slot.museum,
        slot: slot._id,
        date: slot.date,
        user: userId,
        count,
        status: "confirmed",
      }],
      { session }
    );

    await Museum.findByIdAndUpdate(slot.museum, { $push: { bookings: created._id } }, { session });
    await User.findByIdAndUpdate(userId, { $push: { bookings: created._id } }, { session });

    // Transactional outbox: event commits with the booking.
    await OutboxEvent.create(
      [{
        type: EventTypes.BOOKING_CONFIRMED,
        payload: {
          bookingId: String(created._id),
          userId: String(userId),
          slotId: String(slot._id),
          museumId: String(slot.museum),
          count,
          date: slot.date,
        },
      }],
      { session }
    );

    if (slot.booked / slot.capacity >= SLOT_ALMOST_FULL_THRESHOLD) {
      await OutboxEvent.create(
        [{
          type: EventTypes.SLOT_ALMOST_FULL,
          payload: { slotId: String(slot._id), museumId: String(slot.museum), booked: slot.booked, capacity: slot.capacity },
        }],
        { session }
      );
    }

    return created;
  });

  // Kick the dispatcher for low-latency delivery; the poller is the backstop.
  drainOutbox().catch(() => {});
  return booking;
};

export const cancelBooking = async (bookingId) => {
  const result = await withTransaction(async (session) => {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      const err = new Error("Booking not found");
      err.status = 404;
      throw err;
    }
    if (booking.status === "cancelled") {
      return { booking, alreadyCancelled: true };
    }

    booking.status = "cancelled";
    await booking.save({ session });

    if (booking.slot) {
      await releaseCapacity(booking.slot, booking.count, session);
    }
    await Museum.findByIdAndUpdate(booking.museum, { $pull: { bookings: booking._id } }, { session });
    await User.findByIdAndUpdate(booking.user, { $pull: { bookings: booking._id } }, { session });

    await OutboxEvent.create(
      [{
        type: EventTypes.BOOKING_CANCELLED,
        payload: {
          bookingId: String(booking._id),
          userId: String(booking.user),
          slotId: booking.slot ? String(booking.slot) : null,
          museumId: String(booking.museum),
          count: booking.count,
        },
      }],
      { session }
    );

    return { booking, alreadyCancelled: false };
  });

  drainOutbox().catch(() => {});
  return result;
};

export const getBookingById = async (id) => {
  return Booking.findById(id).populate("museum slot");
};

export const getBookingsOfUser = async (userId) => {
  return Booking.find({ user: userId }).populate("museum slot").sort({ createdAt: -1 });
};
