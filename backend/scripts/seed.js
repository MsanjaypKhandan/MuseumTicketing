/**
 * Seed script — populates demo data for local development.
 *
 *   node scripts/seed.js
 *
 * Creates an admin, a couple of museums, and a week of bookable slots each.
 * Idempotent-ish: wipes the demo museums/slots it owns before reseeding so
 * repeated runs don't pile up duplicates.
 */
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";
import Museum from "../models/Museum.js";
import Slot from "../models/Slot.js";
import mongoose from "mongoose";
import { logger } from "../middleware/logger.js";

dotenv.config();

const SLOT_TEMPLATES = [
  { startTime: "09:00", endTime: "11:00", capacity: 50 },
  { startTime: "11:00", endTime: "13:00", capacity: 50 },
  { startTime: "14:00", endTime: "16:00", capacity: 40 },
  { startTime: "16:00", endTime: "18:00", capacity: 40 },
];

const run = async () => {
  await connectDB();

  const email = "demo-admin@historiscan.test";
  const hashed = bcrypt.hashSync("demopassword");
  let admin = await Admin.findOne({ email });
  if (!admin) admin = await Admin.create({ email, password: hashed });

  const museumDefs = [
    { title: "National Museum", description: "A grand national collection.", posterUrl: "https://picsum.photos/seed/nat/600/400", location: "New Delhi", price: 200, site: "Museum" },
    { title: "Ancient Fort", description: "A heritage fort site.", posterUrl: "https://picsum.photos/seed/fort/600/400", location: "Jaipur", price: 150, site: "Heritage_Site" },
  ];

  // Clear demo museums (and their slots) owned by this demo admin.
  const existing = await Museum.find({ admin: admin._id });
  const existingIds = existing.map((m) => m._id);
  await Slot.deleteMany({ museum: { $in: existingIds } });
  await Museum.deleteMany({ _id: { $in: existingIds } });
  admin.addedMuseum = [];

  for (const def of museumDefs) {
    const museum = await Museum.create({ ...def, admin: admin._id });
    admin.addedMuseum.push(museum._id);

    // Create slots for the next 7 days.
    const slots = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);
      for (const t of SLOT_TEMPLATES) {
        slots.push({ museum: museum._id, date, ...t });
      }
    }
    await Slot.insertMany(slots);
    logger.info("seed.museum_created", { title: def.title, slots: slots.length });
  }

  await admin.save();
  logger.info("seed.complete", { admin: email, password: "demopassword" });
  await mongoose.disconnect();
};

run().catch((err) => {
  logger.error("seed.failed", { message: err.message });
  process.exit(1);
});
