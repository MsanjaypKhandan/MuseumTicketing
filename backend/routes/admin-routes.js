import express from "express";
import { adminLogin, addAdmin, getadmins, getadminById } from "../controllers/admin-controller.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const adminRouter = express.Router();

const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 10, name: "admin-auth" });

adminRouter.post("/signup", authLimiter, addAdmin);
adminRouter.post("/login", authLimiter, adminLogin);
adminRouter.get("/", getadmins);
adminRouter.get("/:id", getadminById);

export default adminRouter;
