import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import Museum from "../models/Museum.js";
import Bookings from "../models/Bookings.js";
import mongoose from "mongoose";

export const addMuseum = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token Not Found" });
  }
  const extractedToken = authHeader.split(" ")[1];

  let adminId;
  try {
    const decrypted = jwt.verify(extractedToken, process.env.SECRET_KEY);
    adminId = decrypted.id;
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }

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

  return res.status(201).json({ museum });
};

export const getAllMuseums = async (req, res, next) => {
  const site = req.query.Site;
  let museums;
  try {
    museums = await Museum.find(site ? { site } : {});
  } catch (err) {
    return next(err);
  }
  if (!museums) {
    return res.status(500).json({ message: "Request Failed" });
  }
  return res.status(200).json({ museums });
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
  let museum;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    museum = await Museum.findById(id).session(session);
    if (!museum) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Museum not found" });
    }

    // Remove all bookings that belong to this museum
    await Bookings.deleteMany({ museum: id }, { session });

    // Remove museum from admin's addedMuseum list
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

  return res.status(200).json({ message: "Successfully Deleted" });
};

export const updateMuseum = async (req, res, next) => {
  const museumId = req.params.id;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token Not Found" });
  }
  const extractedToken = authHeader.split(" ")[1];

  try {
    jwt.verify(extractedToken, process.env.SECRET_KEY);
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }

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
    return res.status(200).json({ museum: updatedMuseum });
  } catch (err) {
    return next(err);
  }
};
