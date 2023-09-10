import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    email:{
        type : String,
        unique: true,
        required : true,
    },
    password:{
        type : String,
        minLength: 6,
        required : true,
    },
    addedMuseum : [
        {
            type : mongoose.Types.ObjectId,
            ref: "Museum",
            
        },
    ],
});

export default mongoose.model("Admin",adminSchema);