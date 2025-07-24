import express from "express";
import { deleteUser, login, getAllUsers, signup, updateUser, getBookingsOfUser, getUserById } from "../controllers/user-controller.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const userRouter = express.Router();

// Brute-force protection on credential endpoints.
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 10, name: "user-auth" });

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/signup", authLimiter, signup);
userRouter.put("/:id", updateUser);
userRouter.delete("/:id", deleteUser);
userRouter.post("/login", authLimiter, login);
userRouter.get("/bookings/:id", getBookingsOfUser);

export default userRouter;
