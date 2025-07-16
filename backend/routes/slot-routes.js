import express from "express";
import { createSlot, listSlots } from "../controllers/slot-controller.js";
import verifyToken from "../middleware/auth.js";

// Mounted at /museum/:museumId/slots
const slotRouter = express.Router({ mergeParams: true });

slotRouter.get("/", listSlots);
slotRouter.post("/", verifyToken, createSlot); // admin only

export default slotRouter;
