import Admin from "../models/Admin.js";
import Museum from "../models/Museum.js";
import Bookings from "../models/Bookings.js";
import mongoose from "mongoose";
import { cache } from "../cache/cache.js";

const MUSEUM_CACHE_PREFIX = "museums:";
const invalidateMuseumCache = () => cache.delByPrefix(MUSEUM_CACHE_PREFIX);

export const addMuseum = async (req, res, next) => {
  const adminId = req.adminId; // set by verifyToken middleware
  const { title, description, posterUrl, location, price, site } = req.body;

  if (
    !title || title.trim() === "" ||
    !description || description.trim() === "" ||
    !posterUrl || posterUrl.trim() === "" ||
    !location || location.trim() === "" ||
    !price ||
    !site || site.trim() === ""
  ) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let museum;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    museum = new Museum({ title, description, posterUrl, location, price, site, admin: adminId });
    await museum.save({ session });
    await Admin.findByIdAndUpdate(
      adminId,
      { $push: { addedMuseum: museum._id } },
      { session }
    );
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    return next(err);
  } finally {
    session.endSession();
  }

  await invalidateMuseumCache();
  return res.status(201).json({ museum });
};

export const getAllMuseums = async (req, res, next) => {
  const site = req.query.Site;
  const cacheKey = `${MUSEUM_CACHE_PREFIX}${site || "all"}`;
  try {
    // Cache-aside: serve from cache on hit, else load and populate.
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ museums: cached, cached: true });
    }
    const museums = await Museum.find(site ? { site } : {});
    await cache.set(cacheKey, museums, 300); // 5-minute TTL
    return res.status(200).json({ museums });
  } catch (err) {
    return next(err);
  }
};

export const getMuseumById = async (req, res, next) => {
  const id = req.params.id;
  let museum;
  try {
    museum = await Museum.findById(id).populate("bookings");
  } catch (err) {
    return next(err);
  }
  if (!museum) {
    return res.status(404).json({ message: "Museum not found" });
  }
  return res.status(200).json({ museum });
};

export const deleteMuseum = async (req, res, next) => {
  const id = req.params.id;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const museum = await Museum.findById(id).session(session);
    if (!museum) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Museum not found" });
    }

    await Bookings.deleteMany({ museum: id }, { session });

    if (museum.admin) {
      await Admin.findByIdAndUpdate(
        museum.admin,
        { $pull: { addedMuseum: museum._id } },
        { session }
      );
    }

    await Museum.findByIdAndDelete(id).session(session);
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    return next(err);
  } finally {
    session.endSession();
  }

  await invalidateMuseumCache();
  return res.status(200).json({ message: "Successfully Deleted" });
};

export const updateMuseum = async (req, res, next) => {
  const museumId = req.params.id;

  const updateFields = {};
  if (req.body.title) updateFields.title = req.body.title;
  if (req.body.description) updateFields.description = req.body.description;
  if (req.body.posterUrl) updateFields.posterUrl = req.body.posterUrl;
  if (req.body.location) updateFields.location = req.body.location;
  if (req.body.price) updateFields.price = req.body.price;

  if (Object.keys(updateFields).length === 0) {
    return res.status(422).json({ message: "No valid fields provided for update" });
  }

  try {
    const updatedMuseum = await Museum.findByIdAndUpdate(
      museumId,
      { $set: updateFields },
      { new: true }
    );
    if (!updatedMuseum) {
      return res.status(404).json({ message: "Museum not found" });
    }
    await invalidateMuseumCache();
    return res.status(200).json({ museum: updatedMuseum });
  } catch (err) {
    return next(err);
  }
};
