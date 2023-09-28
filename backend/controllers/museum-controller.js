
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import Museum from "../models/Museum.js";
import mongoose from "mongoose";

export const addMuseum = async(req,res,next) => {
    const extractedTOken = req.headers.authorization.split(" ")[1];
    if(!extractedTOken && extractedTOken.trim()===""){
         return res.status(404).json({message: "Token Not Found"});
    }

    let adminId;

     //verify token
    jwt.verify(extractedTOken,process.env.SECRET_KEY,(err,decrypted) => {
        if(err){

            return res.status(400).json({message: `${err.message}`});
        }else{
            adminId = decrypted.id;
            return;
        }
    });

    //create new museum
    const { title, description, posterUrl,location,price } =
    req.body;
  if (
    !title &&
    title.trim() === "" &&
    !description &&
    description.trim() == "" &&
    !posterUrl &&
    posterUrl.trim() === "" &&
    !location &&
    location.trim() === "" &&
    !price
  ) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }
   
    
    
    let museum;
    try{
        museum = new Museum({
            title,description,posterUrl,adminId,location,price
        });
        const session = await mongoose.startSession();
        const adminUser = await Admin.findById(adminId);
        session.startTransaction();
        await museum.save({session});
        adminUser.addedMuseum.push(museum);
        await adminUser.save({session});
        await session.commitTransaction();
        }
        catch(err){
            return console.log(err);
        }
    if(!museum){
        return res.status(500).json({message:"Request Failed"});
    }
    return res.status(201).json({museum});
};

export const getAllMuseums = async (req,res,next) => {
    let museums;
     try{
        museums = await Museum.find();
     }catch(err){
        return console.log(err);
     }

     if(!museums){
        return res.status(500).json({message : "Request Failed"});
     }
     return res.status(200).json({museums});
};

export const getMuseumById = async(req,res,next) => {
    const id = req.params.id;
    let museum;
    try{
        museum = await Museum.findById(id).populate("bookings");
    }catch(err){
        return console.log(err);
    }

    if(!museum){
        return res.status(404).json({message : "Invalid Museum ID"});
    }

    return res.status(200).json({museum});
};

export const deleteMuseum = async(req,res,next) => {
    const id = req.params.id;
    let museum;
    try{
        museum=await Museum.findByIdAndDelete(id).populate("admin bookings");
        console.log(museum);
        const session = await mongoose.startSession();
        session.startTransaction();
        // await museum.admin.addedMuseum.pull(museum);
        await museum.bookings.museum.pull(museum);
        await museum.bookings.save({session});
        await museum.admin.save({session});
        session.commitTransaction();
    }catch(err){
        return console.log(err);
    }
    if(!museum){
        return res.status(500).json({message: "Unable to Delete"});
       }
       return res.status(201).json({message:"Successfully Deleted"});
};

export const updateMuseum = async (req,res,next) => {
    const museumId = req.params.id;
    const extractedTOken = req.headers.authorization.split(" ")[1];
    if(!extractedTOken && extractedTOken.trim()===""){
         return res.status(404).json({message: "Token Not Found"});
    }

    let adminId;

     //verify token
    jwt.verify(extractedTOken,process.env.SECRET_KEY,(err,decrypted) => {
        if(err){

            return res.status(400).json({message: `${err.message}`});
        }else{
            adminId = decrypted.id;
            return;
        }
    });
// Check if the logged-in admin has permission to update the museum
   
    // Extract updated data from the request body
  const updateFields = {};
  if (req.body.title) updateFields.title = req.body.title;
  if (req.body.description) updateFields.description = req.body.description;
  if (req.body.posterUrl) updateFields.posterUrl = req.body.posterUrl;
  if (req.body.location) updateFields.location = req.body.location;
  if (req.body.price) updateFields.price = req.body.price;
    
   // Validate if at least one field is provided for update
   if (Object.keys(updateFields).length === 0) {
    return res.status(422).json({ message: "No valid fields provided for update" });
  }

  try {
    // Find the museum by ID and update only the specified fields
    const updatedMuseum = await Museum.findByIdAndUpdate(
      museumId,
      { $set: updateFields },
      { new: true } // Return the modified document rather than the original
    );

    // if (!updatedMuseum) {
    //   return res.status(404).json({ message: "Museum not found" });
    // }

    return res.status(200).json({ museum: updatedMuseum });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Request failed" });
  }

};
