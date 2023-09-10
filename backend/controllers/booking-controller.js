import Bookings from "../models/Bookings.js";
import Museum from "../models/Museum.js";
import User from "../models/User.js"
import mongoose from "mongoose";
export const newBooking = async(req,res,next) => {

    const {museum,date,user,count,
    
    } = req.body;

    let existingMuseum;
    let existingUser;

    try{
        existingMuseum= await Museum.findById(museum);
        existingUser= await User.findById(user);
    }catch(err){
        return console.log(err);
    }
    
    if(!existingMuseum){
        return res.status(404).json({message: "Museum Not With given Id"});
    }
    if(!existingUser){
        return res.status(404).json({message: "User Not With given Id"});
    }
    let booking;

    try{
        booking = new Bookings({museum,
        date: new Date(`${date}`),
    user,count});
    booking = await booking.save();
    const session = await mongoose.startSession();
    session.startTransaction();
    existingUser.bookings.push(booking);
    existingMuseum.bookings.push(booking);
    await existingMuseum.save({session});
    await existingUser.save({session});
    await booking.save({session});
    session.commitTransaction();
    // booking = await booking.save();
    }catch(err){ 
        return console.log(err);
    }
   if(!booking){
    return res.status(500).json({message: "Unable to Book"});
   }
   return res.status(201).json({booking});
};

export const getBookingById = async (req,res,next) => {
    const id = req.params.id;
    let booking;
    try{
        booking = await Bookings.findById(id);
    }catch(err){
        return console.log(err);
    }
    if(!booking){
        return res.status(500).json({message: "Unexpected  Error"});
       }
       return res.status(201).json({booking});
};

export const deleteBooking = async(req,res,next) => {
    const id = req.params.id;
    let booking;
    try{
        booking=await Bookings.findByIdAndRemove(id).populate("user museum");
        console.log(booking);
        const session = await mongoose.startSession();
        session.startTransaction();
        await booking.user.bookings.pull(booking);
        await booking.museum.bookings.pull(booking);
        await booking.museum.save({session});
        await booking.user.save({session});
        session.commitTransaction();
    }catch(err){
        return console.log(err);
    }
    if(!booking){
        return res.status(500).json({message: "Unable to Delete"});
       }
       return res.status(201).json({message:"Successfully Deleted"});
};