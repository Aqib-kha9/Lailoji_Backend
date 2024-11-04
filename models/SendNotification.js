import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    trim: true, // URL or path to the image
  },
  category: {
    type: String,
    required: true,
    trim: true, // For example, "Product", "News", etc.
  },
  notificationCount: {
    type: Number,
    default: 0, // Number of times the notification has been sent or viewed
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Method to increment notificationCount
notificationSchema.methods.incrementCount = async function () {
  this.notificationCount += 1;
  await this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
