import  mongoose from "mongoose";

const museumSchema = new mongoose.Schema({
    title:{
        type : String,
        required : true

    },
    description:{
       type: String,
       required:true
    },
    posterUrl:{
       type : String,
       required : true
    },
    location:{
      type:String,
      required:true,
     },
     price:{
      type:Number,
      required:true,
     },
    bookings : [{
       type: mongoose.Types.ObjectId,
       ref: "Booking"
      }],
     admin:{
      type: mongoose.Types.ObjectId,
      ref: "Admin",
     } ,
     site :{
      type:String,
      required: true,
     }
     
    
});

export default mongoose.model("Museum",museumSchema);