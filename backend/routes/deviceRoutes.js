import express from "express";
import { getDeviceData } from "../controllers/deviceController.js";

const router = express.Router();

router.get("/devices", getDeviceData);

export default router;  
