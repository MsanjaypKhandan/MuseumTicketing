import mongoose from "mongoose";
import Slot from "../models/Slot.js";
import Booking from "../models/Bookings.js";

/**
 * Analytics service — read-model queries built with MongoDB aggregation
 * pipelines. These run server-side in the database, returning only the
 * computed summary rather than pulling raw documents into Node and looping.
 */

/**
 * Per-slot occupancy for a museum: how full each slot is, sorted by date.
 * Pure pipeline — grouping and the occupancy ratio are computed in Mongo.
 */
export const slotOccupancy = async (museumId) => {
  return Slot.aggregate([
    { $match: { museum: new mongoose.Types.ObjectId(museumId) } },
    {
      $project: {
        date: 1,
        startTime: 1,
        endTime: 1,
        capacity: 1,
        booked: 1,
        occupancyRate: {
          $cond: [{ $eq: ["$capacity", 0] }, 0, { $divide: ["$booked", "$capacity"] }],
        },
      },
    },
    { $sort: { date: 1, startTime: 1 } },
  ]);
};

/**
 * Revenue + volume summary for a museum, joining confirmed bookings to the
 * museum price via $lookup and summing count * price entirely in the
 * pipeline.
 */
export const museumSummary = async (museumId) => {
  const result = await Booking.aggregate([
    {
      $match: {
        museum: new mongoose.Types.ObjectId(museumId),
        status: "confirmed",
      },
    },
    {
      $lookup: {
        from: "museums",
        localField: "museum",
        foreignField: "_id",
        as: "museum",
      },
    },
    { $unwind: "$museum" },
    {
      $group: {
        _id: "$museum._id",
        totalBookings: { $sum: 1 },
        totalTickets: { $sum: "$count" },
        revenue: { $sum: { $multiply: ["$count", "$museum.price"] } },
        checkedIn: { $sum: { $cond: [{ $ne: ["$usedAt", null] }, 1, 0] } },
      },
    },
  ]);

  return result[0] || { totalBookings: 0, totalTickets: 0, revenue: 0, checkedIn: 0 };
};

/**
 * Peak demand: ticket volume bucketed by slot start time across all dates,
 * revealing the busiest times of day.
 */
export const peakTimes = async (museumId) => {
  return Booking.aggregate([
    {
      $match: {
        museum: new mongoose.Types.ObjectId(museumId),
        status: "confirmed",
        slot: { $ne: null },
      },
    },
    { $lookup: { from: "slots", localField: "slot", foreignField: "_id", as: "slot" } },
    { $unwind: "$slot" },
    {
      $group: {
        _id: "$slot.startTime",
        tickets: { $sum: "$count" },
      },
    },
    { $sort: { tickets: -1 } },
  ]);
};
