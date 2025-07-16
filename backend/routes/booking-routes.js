import express from "express";
import { deleteBooking, getBookingById, newBooking } from "../controllers/booking-controller.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const bookingRouter = express.Router();

// Throttle booking creation to blunt spam/scalping bursts from one client.
const bookingLimiter = rateLimiter({ windowMs: 60 * 1000, max: 20, name: "booking" });

bookingRouter.post("/", bookingLimiter, newBooking);
bookingRouter.get("/:id", getBookingById);
bookingRouter.delete("/:id", deleteBooking);

export default bookingRouter;
