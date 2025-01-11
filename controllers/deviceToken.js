import DeviceToken from "../models/DeviceToken.js"; // Import your Mongoose model

export const saveDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Device token is required." });
    }

    // Check if the token already exists
    const existingToken = await DeviceToken.findOne({ token });

    if (existingToken) {
      return res.status(200).json({ message: "Device token already exists." });
    }

    // Save the new token
    const newToken = new DeviceToken({ token });
    await newToken.save();

    return res.status(201).json({ message: "Device token saved successfully." });
  } catch (error) {
    console.error("Error saving device token:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};


export const getAllDeviceTokens = async (req, res) => {
    try {
      const tokens = await DeviceToken.find();
      return res.status(200).json(tokens);
    } catch (error) {
      console.error("Error fetching device tokens:", error);
      return res.status(500).json({ message: "Internal Server Error." });
    }
  };
  