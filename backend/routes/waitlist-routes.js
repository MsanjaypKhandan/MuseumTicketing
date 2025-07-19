import express from "express";
import { joinWaitlist, myWaitlist } from "../controllers/waitlist-controller.js";

const waitlistRouter = express.Router();

waitlistRouter.post("/", joinWaitlist);
waitlistRouter.get("/user/:userId", myWaitlist);

export default waitlistRouter;
