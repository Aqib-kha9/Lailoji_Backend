import mongoose from 'mongoose';

// Order Item Schema (Reused for Refund Schema)
const refundItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // Price at the time of purchase
    tax: { type: Number, default: 0 }, // Tax amount
    itemDiscount: { type: Number, default: 0 }, // Discount amount on the item
    totalPrice: { type: Number, required: true }, // Total price after tax and discount
  },
  { _id: false } // Prevent creating separate IDs for each item
);

// Refund Reason Schema (Nested Object)
const refundReasonSchema = new mongoose.Schema(
  {
    description: { type: String, required: true }, // Description of the refund reason
    images: { type: [String], default: [] }, // List of image URLs or file paths
  },
  { _id: false } // Prevent creating a separate ID for refundReason
);

// Refund Log Schema
const refundLogSchema = new mongoose.Schema({
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User who changed the status
  date: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], required: true },
  note: { type: String },
});

// Refund Schema
const refundSchema = new mongoose.Schema(
  {
    refundId: { type: String, required: true, unique: true },
    refundRequestedDate: { type: Date, default: Date.now },
    refundStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    paymentMethod: { type: String, required: true }, // Payment method
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // Reference to Order
    products: [refundItemSchema], // Embedded order items
    refundableAmount: { type: Number, required: true }, // Total refundable amount
    refundReason: { type: refundReasonSchema, required: true }, // Nested refund reason object
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true }, // Reference to Seller
    deliverymanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to Deliveryman (optional)
    refundLogs: [refundLogSchema], // Logs of refund status changes
     // New customerDetails field
     customerDetails: {
      name: { type: String, required: true }, // Customer's name
      email: { type: String, required: true }, // Customer's email
      phone: { type: String, required: true }, // Customer's phone number
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;
