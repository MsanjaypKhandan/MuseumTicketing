import Admin  from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const addAdmin = async(req,res,next) => {
    const{ email, password } = req.body;
    if(!email && email.trim()==="" && !password && password.trim()===""){
      res.status(422).json({message:"Invalid Inputs"});
    }

    let existingAdmin;
    try{
        existingAdmin = await Admin.findOne({email});
    }catch(err){
        return console.log(err);
    }

    if(existingAdmin){
        return res.status(400).json({message:"Admin already exists"});
    }

    let admin;
    const hashPassword = bcrypt.hashSync(password);
    try{
        admin = new Admin({email, password:hashPassword});
        admin = await admin.save();
    }catch(err){
       return console.log(err);
    }

    if(!admin){
        return res.status(500).json({message:"Invalid Creditianls"});
    }
    return res.status(201).json({admin});
    
};

export const adminLogin = async(req,res,next) => {
    const {email,password}=req.body;
    if(
      !email && email.trim() ===""&&
      !password && password.trim() === ""
  ){
      return res.status(422).json({message: "Invalid Inputs"});
  }
  let existingAdmin;
  try{
    existingAdmin=await Admin.findOne({email});
  }catch(err){
    return console.log(err);
  }
   
  if(!existingAdmin){
    return res.status(404).json({message:"Admon not found"});
  }
  const isPasswordCorrect =bcrypt.compare(password,existingAdmin.password);

  if(!isPasswordCorrect){
    return res.status(400).json({message:"Incorrect Pasword"});
  }
  const token = jwt.sign({id: existingAdmin._id}, process.env.SECRET_KEY,{expiresIn:"7d",})
  return res.status(200).json({message:"Authentication Complete",token,id: existingAdmin._id});
  };

  export const getadmins = async (req, res, next) => {
    let admins;
    try{
        admins = await Admin.find();
    }catch(err){
        return console.log(err);
    }
    if(!admins){
        return res.status(500).json({message:"Internal Server Error"});
    }
    return res.status(200).json({admins});
  };

  export const getadminById = async(req,res,next) => {
    const Id = req.params.id;
    let admin;
    try{
        admin = await Admin.findById(Id).populate("addedMuseum");
    }catch(err){
        return console.log(err);
    }
    if(!admin){
        return console.log("Cannot find Admin");
    }
    return res.status(200).json({admin});
  };