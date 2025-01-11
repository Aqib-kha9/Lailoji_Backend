import mongoose from "mongoose";

const DeviceTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DeviceToken = mongoose.model("DeviceToken", DeviceTokenSchema);

export default DeviceToken;
