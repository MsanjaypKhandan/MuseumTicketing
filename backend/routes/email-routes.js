import express from "express";
import { sendemail} from "../controllers/email/email-controller.js";

const emailRouter = express.Router();

emailRouter.post("/",sendemail);


export default emailRouter;