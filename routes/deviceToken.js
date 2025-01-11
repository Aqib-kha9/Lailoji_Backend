import express from "express";
import { saveDeviceToken, getAllDeviceTokens } from "../controllers/deviceToken.js";

const router = express.Router();

// Save device token
router.post("/", saveDeviceToken);

// Fetch all device tokens
router.get("/", getAllDeviceTokens);

export default router;
