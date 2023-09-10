import mongoose from "mongoose";

const bookingSchema = mongoose.Schema({
    museum : {
        type : mongoose.Types.ObjectId,
        ref : "Museum",
        required: true,
    },
    date:{
       type : Date,
       required : true,
    },
    user: {
        type : mongoose.Types.ObjectId,
        ref : "User",
        required : true,
    },
    count: {
        type : Number,
        required:true,
    }
});

export default mongoose.model("Booking",bookingSchema);