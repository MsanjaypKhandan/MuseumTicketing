import express from "express";
import { getTicket, verifyTicket } from "../controllers/ticket-controller.js";
import verifyToken from "../middleware/auth.js";

const ticketRouter = express.Router();

ticketRouter.get("/:bookingId", getTicket);
ticketRouter.post("/verify", verifyToken, verifyTicket); // staff/admin only

export default ticketRouter;
