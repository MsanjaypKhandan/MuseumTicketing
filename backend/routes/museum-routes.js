import express from "express";
import { addMuseum, deleteMuseum, getAllMuseums, getMuseumById, updateMuseum } from "../controllers/museum-controller.js";
import verifyToken from "../middleware/auth.js";

const museumRouter = express.Router();

museumRouter.get("/", getAllMuseums);
museumRouter.get("/:id", getMuseumById);
museumRouter.post("/", verifyToken, addMuseum);
museumRouter.put("/:id", verifyToken, updateMuseum);
museumRouter.delete("/:id", deleteMuseum);

export default museumRouter;
