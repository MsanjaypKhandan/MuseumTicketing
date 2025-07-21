import qrcode from "qrcode";
import Booking from "../models/Bookings.js";
import OutboxEvent from "../models/OutboxEvent.js";
import { signTicket, verifyTicket } from "../utils/ticket.js";
import { drainOutbox } from "../events/dispatcher.js";
import { EventTypes } from "../events/eventTypes.js";

/**
 * Issues the signed ticket token for a confirmed booking and renders it as
 * a QR data URL the client can display or embed in an email.
 */
export const issueTicket = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }
  if (booking.status !== "confirmed") {
    const err = new Error("Ticket unavailable for a non-confirmed booking");
    err.status = 409;
    throw err;
  }

  const token = signTicket({
    bookingId: String(booking._id),
    slotId: String(booking.slot),
    museumId: String(booking.museum),
    count: booking.count,
  });

  const qrDataUrl = await qrcode.toDataURL(token);
  return { token, qrDataUrl };
};

/**
 * Verifies a scanned ticket at the gate.
 *
 * Two-layer check:
 *  1. Signature — proves authenticity offline (no DB needed). A forged QR
 *     fails here.
 *  2. One-time use — atomically stamps usedAt only if it was null. The
 *     filter { usedAt: null } makes the check-and-set a single atomic
 *     update, so two simultaneous scans of the same ticket cannot both
 *     succeed. The second scan matches no document → already used.
 */
export const verifyAndConsumeTicket = async (token) => {
  let claims;
  try {
    claims = verifyTicket(token);
  } catch {
    const err = new Error("Invalid or tampered ticket");
    err.status = 400;
    throw err;
  }

  const booking = await Booking.findById(claims.bookingId);
  if (!booking) {
    const err = new Error("Ticket references unknown booking");
    err.status = 404;
    throw err;
  }
  if (booking.status === "cancelled") {
    const err = new Error("Booking was cancelled");
    err.status = 409;
    throw err;
  }

  const consumed = await Booking.findOneAndUpdate(
    { _id: claims.bookingId, usedAt: null },
    { $set: { usedAt: new Date() } },
    { new: true }
  );

  if (!consumed) {
    const err = new Error("Ticket already used");
    err.status = 409;
    err.code = "ALREADY_USED";
    throw err;
  }

  await OutboxEvent.create({
    type: EventTypes.TICKET_VERIFIED,
    payload: { bookingId: String(consumed._id), userId: String(consumed.user), usedAt: consumed.usedAt },
  });
  drainOutbox().catch(() => {});

  return { bookingId: String(consumed._id), count: consumed.count, usedAt: consumed.usedAt };
};
