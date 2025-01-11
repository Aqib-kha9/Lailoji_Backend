import Notification from "../models/Notification.js";
import DeviceToken from "../models/DeviceToken.js";
import { messaging } from "../config/firebase.js";
import multer from 'multer'; // Import multer for file upload

// Set up multer for image upload
const upload = multer({
  dest: 'uploads/',  // Specify the directory where images will be stored
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).single('image'); // Accept a single file under the field name 'image'

// Helper to create a new notification in the database
export const createNotification = async (data) => {
  const notification = new Notification(data);
  await notification.save();
  return notification;
};

// Helper to send notifications using Firebase
export const sendNotification = async (tokens, { title, description, imageUrl }) => {
  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body: description },
      data: { imageUrl: imageUrl || "https://example.com/default-image.jpg" },
    });

    console.log(`${response.successCount} messages sent successfully`);
    if (response.failureCount > 0) {
      console.warn(`${response.failureCount} messages failed to send`);
    }

    return response;
  } catch (error) {
    console.error("Error sending notifications:", error.message || error);
    throw error;
  }
};

// Send a new notification
export const sendNewNotification = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: "Error uploading file: " + err.message });
    }

    try {
      // Destructure the required fields from the request body
      const { title, description, recipientTokens } = req.body;

      // Check if title and description are provided
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: "Title and description are required.",
        });
      }

      // Fetch stored tokens from the database
      const storedTokens = await DeviceToken.find().select("token").lean();
      const storedTokensArray = storedTokens.map((tokenDoc) => tokenDoc.token);

      // Parse and validate recipient tokens from the request body
      let parsedTokens = [];
      if (recipientTokens) {
        try {
          // If recipientTokens is a string, attempt to parse it as JSON
          parsedTokens = typeof recipientTokens === "string" ? JSON.parse(recipientTokens) : recipientTokens;
        } catch (error) {
          return res.status(400).json({ success: false, message: "Invalid recipient tokens format." });
        }
      }

      // Ensure that parsedTokens is an array of strings
      if (!Array.isArray(parsedTokens) || !parsedTokens.every((token) => typeof token === "string")) {
        return res.status(400).json({
          success: false,
          message: "Recipient tokens must be an array of strings.",
        });
      }

      // Combine and deduplicate tokens (use a Set to avoid duplicates)
      const allTokens = [...new Set([...storedTokensArray, ...parsedTokens])];

      if (allTokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid recipient tokens found.",
        });
      }

      console.log("All Tokens:", allTokens); // Log the final tokens array to debug

      // Prepare image URL (path of the uploaded image)
      const imageUrl = req.file ? req.file.path : "https://example.com/default-image.jpg";

      // Create and save notification in the database
      const notification = await createNotification({
        title,
        description,
        imageUrl,
        recipientTokens: allTokens,
      });

      // Send notifications
      const response = await sendNotification(allTokens, { title, description, imageUrl });
      console.log(response)
      // Update notification success count
      notification.notificationCount = response.successCount;
      await notification.save();

      res.status(200).json({ success: true, notification });
    } catch (error) {
      console.error("Error sending new notification:", error.message || error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
};


// Get all notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error.message || error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resend a notification
export const handleResendNotification = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the notification by ID
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    // Send the notification again
    const response = await sendNotification(notification.recipientTokens, notification);

    // Update notification count after resending
    notification.notificationCount += response.successCount;
    await notification.save();

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Error resending notification:", error.message || error);
    res.status(500).json({ success: false, message: error.message });
  }
};
