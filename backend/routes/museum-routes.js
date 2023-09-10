import express from "express";
import { addMuseum, deleteMuseum, getAllMuseums, getMuseumById,updateMuseum } from "../controllers/museum-controller.js";


const museumRouter = express.Router();

museumRouter.post("/",addMuseum);
museumRouter.get("/",getAllMuseums);
museumRouter.get("/:id",getMuseumById);
museumRouter.delete("/:id",deleteMuseum);
museumRouter.put("/:id",updateMuseum);

export default museumRouter;