import mongoose from 'mongoose';

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true }, // Price at the time of purchase
  tax: { type: Number, default: 0 }, // Tax amount
  itemDiscount: { type: Number, default: 0 }, // Discount amount on the item
  totalPrice: { type: Number, required: true } // Total price after tax and discount
}, { _id: false }); // Prevent creating separate IDs for each item in the order

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // Ensuring unique order IDs
  total: { type: Number, required: true }, // Total amount of the order
  status: {
    type: String,
    enum: ['Pending', 'Confirmed','Packaging', 'Ongoing', 'Delivered', 'Canceled', 'Returned', 'Failed'],
    default: 'Pending',
    required: true
  },
  date: { type: Date, default: Date.now }, // Date of the order
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }, // Reference to Customer
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true }, // Reference to Vendor
  customerAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerAddress', required: true }, // Reference to Customer Address
  
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
    default: 'Pending',
    required: true
  },
  paymentMethod: { type: String, required: true }, // Payment method
  verificationCode: { type: String, required: true }, // Order verification code

  delivery: {
    deliveryMan: {
      name: { type: String, required: false }, // Name of the delivery man
      contact: { type: String, required: false } // Contact information
    },
    expectedDeliveryDate: { type: Date, required: false } // Expected delivery date
  },

  orderItems: [orderItemSchema] // Array of items in the order
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Create the Order model
const Order = mongoose.model('Order', orderSchema);



export default Order;
