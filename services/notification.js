import Notification from "../models/Notification.js";
import { messaging } from "../config/firebase.js";

export const createNotification = async (data) => {
  const notification = new Notification(data);
  await notification.save();
  return notification;
};


// import { messaging } from "../config/firebase.js";

// Send a notification to multiple tokens
export const sendNotification = async (notification) => {
    const { title, description, imageUrl, recipientTokens } = notification;
  
    // Ensure the 'tokens' field is properly set
    const message = {
      notification: {
        title,
        body: description,
      },
      data: {
        imageUrl: imageUrl, // Additional data
      },
      tokens: recipientTokens, // Array of device tokens to send to
    };
  
    try {
      // Send message to multiple devices using 'tokens'
      const response =  await messaging.sendAll([message]); // You can use sendMulticast() to send to multiple tokens
      console.log(`${response.successCount} messages were sent successfully`);
      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  };


export const resendNotification = async (id) => {
  const notification = await Notification.findById(id);
  if (!notification) throw new Error("Notification not found");

  const response = await sendNotification(notification);
  notification.notificationCount += response.successCount;
  await notification.save();

  return notification;
};

export const getAllNotifications = async () => {
  return await Notification.find();
};
