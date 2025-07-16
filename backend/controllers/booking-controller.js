import * as bookingService from "../services/bookingService.js";

/**
 * Booking controller — thin HTTP adapter over bookingService. All domain
 * logic (capacity, transactions, events) lives in the service so it can be
 * unit-tested without HTTP and reused by other entry points (e.g. waitlist
 * promotion).
 */

export const newBooking = async (req, res, next) => {
  // slotId is the new capacity-managed path; museum/date kept for back-compat
  const { slot, slotId, user, count } = req.body;
  try {
    const booking = await bookingService.createBooking({
      slotId: slotId || slot,
      userId: user,
      count: Number(count),
    });
    return res.status(201).json({ booking });
  } catch (err) {
    if (err.code === "SLOT_FULL") {
      return res.status(409).json({ message: err.message, code: "SLOT_FULL" });
    }
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(200).json({ booking });
  } catch (err) {
    return next(err);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const { alreadyCancelled } = await bookingService.cancelBooking(req.params.id);
    return res.status(200).json({
      message: alreadyCancelled ? "Booking was already cancelled" : "Successfully Deleted",
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }
};
