import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import userRouter from "./routes/user-routes.js";
import adminRouter from "./routes/admin-routes.js";
import emailRouter from "./routes/email-routes.js";
import museumRouter from "./routes/museum-routes.js";
import bookingRouter from "./routes/booking-routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/museum", museumRouter);
app.use("/booking", bookingRouter);
app.use("/sendEmail", emailRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}`, err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((e) => {
    console.error("Database connection failed:", e.message);
    process.exit(1);
  });
