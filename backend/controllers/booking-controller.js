import Bookings from "../models/Bookings.js";
import Museum from "../models/Museum.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const newBooking = async (req, res, next) => {
  const { museum, date, user, count } = req.body;

  if (!museum || !date || !user || !count) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingMuseum;
  let existingUser;
  try {
    existingMuseum = await Museum.findById(museum);
    existingUser = await User.findById(user);
  } catch (err) {
    return next(err);
  }

  if (!existingMuseum) {
    return res.status(404).json({ message: "Museum not found" });
  }
  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }

  let booking;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    booking = new Bookings({ museum, date: new Date(date), user, count });
    await booking.save({ session });

    await Museum.findByIdAndUpdate(
      museum,
      { $push: { bookings: booking._id } },
      { session }
    );
    await User.findByIdAndUpdate(
      user,
      { $push: { bookings: booking._id } },
      { session }
    );
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    return next(err);
  } finally {
    session.endSession();
  }

  return res.status(201).json({ booking });
};

export const getBookingById = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Bookings.findById(id);
  } catch (err) {
    return next(err);
  }
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  return res.status(200).json({ booking });
};

export const deleteBooking = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Bookings.findById(id).populate("user museum");
  } catch (err) {
    return next(err);
  }

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await Museum.findByIdAndUpdate(
      booking.museum._id,
      { $pull: { bookings: booking._id } },
      { session }
    );
    await User.findByIdAndUpdate(
      booking.user._id,
      { $pull: { bookings: booking._id } },
      { session }
    );
    await Bookings.findByIdAndDelete(id, { session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    return next(err);
  } finally {
    session.endSession();
  }

  return res.status(200).json({ message: "Successfully Deleted" });
};
