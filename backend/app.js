import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import userRouter from "./routes/user-routes.js";
import adminRouter from "./routes/admin-routes.js";
import emailRouter from "./routes/email-routes.js";
import museumRouter from "./routes/museum-routes.js";
import bookingRouter from "./routes/booking-routes.js";
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
app.use("/sendEmail", emailRouter);

app.use(errorHandler);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  logger.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => logger.info(`Server running on port ${port}`));
  })
  .catch((e) => {
    logger.error("Database connection failed", { message: e.message });
    process.exit(1);
  });
