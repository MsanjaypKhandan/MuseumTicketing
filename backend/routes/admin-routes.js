import express from "express";
import { adminLogin,addAdmin,getadmins, getadminById } from "../controllers/admin-controller.js";

const adminRouter = express.Router();

adminRouter.post("/signup",addAdmin);
adminRouter.post("/login",adminLogin);
adminRouter.get("/",getadmins);
adminRouter.get("/:id",getadminById);

// adminRouter.get("/",getAdmins);

export default adminRouter;