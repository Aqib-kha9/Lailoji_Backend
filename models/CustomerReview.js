import mongoose from 'mongoose';

// Define the customer review schema
const customerReviewSchema = new mongoose.Schema({
  reviewId: { type: String, required: true, unique: true }, // Review ID
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product model
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }, // Reference to Customer model
  rating: { type: Number, min: 1, max: 5, required: true }, // Rating from 1 to 5
  review: { type: String, required: true }, // Review content
  reply: { type: String, default: '' }, // Reply to the review
  date: { type: Date, default: Date.now }, // Date of review
  status: { type: Boolean, default: false } // Review status
}, { timestamps: true });

// Create the CustomerReview model
const CustomerReview = mongoose.model('CustomerReview', customerReviewSchema);

export default CustomerReview;
