import express from 'express';
import { sendNewNotification, getNotifications, handleResendNotification } from "../controllers/notification.js";

const router = express.Router();

// Route for sending a new notification
// The image upload middleware is applied directly in the route
// `upload.single('image')` will handle image upload
router.post("/", sendNewNotification);  // The middleware `upload.single('image')` is now used inside the controller

// Route for getting all notifications
router.get("/", getNotifications);

// Route for resending a notification
router.post("/resend/:id", handleResendNotification);

export default router;
