import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRouter from "./routes/user-routes.js";
import adminRouter from "./routes/admin-routes.js";
import emailRouter from "./routes/email-routes.js";
import museumRouter from "./routes/museum-routes.js";
import bookingRouter from "./routes/booking-routes.js";
import waitlistRouter from "./routes/waitlist-routes.js";
import notificationRouter from "./routes/notification-routes.js";
import ticketRouter from "./routes/ticket-routes.js";

import { connectDB } from "./config/db.js";
import { registerSubscribers } from "./events/subscribers/index.js";
import { startOutboxPoller } from "./events/dispatcher.js";
import { requestLogger, errorHandler, logger } from "./middleware/logger.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/museum", museumRouter);
app.use("/booking", bookingRouter);
app.use("/waitlist", waitlistRouter);
app.use("/notification", notificationRouter);
app.use("/ticket", ticketRouter);
app.use("/sendEmail", emailRouter);

app.use(errorHandler);

const start = async () => {
  await connectDB();

  // Wire the event-driven layer before serving traffic.
  registerSubscribers();
  startOutboxPoller(Number(process.env.OUTBOX_POLL_MS) || 10000);

  const port = process.env.PORT || 5000;
  app.listen(port, () => logger.info(`Server running on port ${port}`));
};

start();

export default app;
