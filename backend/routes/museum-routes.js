import express from "express";
import { addMuseum, deleteMuseum, getAllMuseums, getMuseumById, updateMuseum } from "../controllers/museum-controller.js";
import { museumAnalytics } from "../controllers/analytics-controller.js";
import verifyToken from "../middleware/auth.js";
import slotRouter from "./slot-routes.js";

const museumRouter = express.Router();

museumRouter.get("/", getAllMuseums);
museumRouter.get("/:id", getMuseumById);
museumRouter.post("/", verifyToken, addMuseum);
museumRouter.put("/:id", verifyToken, updateMuseum);
museumRouter.delete("/:id", deleteMuseum);

// Analytics dashboard for a museum (admin)
museumRouter.get("/:museumId/analytics", verifyToken, museumAnalytics);

// Nested slot resource: /museum/:museumId/slots
museumRouter.use("/:museumId/slots", slotRouter);

export default museumRouter;
