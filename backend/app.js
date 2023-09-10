import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/user-routes.js";
import adminRouter from "./routes/admin-routes.js";
import emailRouter from "./routes/email-routes.js";
import dotenv from "dotenv";
import museumRouter from "./routes/museum-routes.js";
import bookingRouter from "./routes/booking-routes.js";
import cors from "cors";

dotenv.config();
const app = express();
//middlewares
app.use(cors());
app.use(express.json());
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/museum", museumRouter);
app.use("/booking", bookingRouter);
app.use("/sendEmail",emailRouter);
 
mongoose.connect(`mongodb+srv://Sanjayp_Khandan:9840626847@cluster0.rixl0ry.mongodb.net/?retryWrites=true&w=majority`
).then(()=>app.listen(5000,()=>
    console.log("connected?")
)
).catch((e)=>console.log(e));


app.get("/",(req,res)=>{
    res.json("home page");
})