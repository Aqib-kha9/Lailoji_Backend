import mongoose from 'mongoose';

// Define the shipping address schema
const shippingAddressSchema = new mongoose.Schema({
  contactPersonName: { type: String, required: true }, // Contact person name
  phone: { type: String, required: true }, // Phone number
  addressType: { type: String, enum: ['Permanent', 'Temporary'], required: true }, // Address type
  country: { type: String, required: true }, // Country
  city: { type: String, required: true }, // City
  zipCode: { type: String, required: true }, // Zip code
  address: { type: String, required: true }, // Full address
  note: { type: String, default: 'Note: You need to select address from your selected country' } // Note for users
}, { _id: false }); // Prevent creating separate IDs for each address

// Define the billing address schema
const billingAddressSchema = new mongoose.Schema({
  contactPersonName: { type: String, required: true }, // Contact person name
  phone: { type: String, required: true }, // Phone number
  addressType: { type: String, enum: ['Permanent', 'Temporary'], required: true }, // Address type
  country: { type: String, required: true }, // Country
  city: { type: String, required: true }, // City
  zipCode: { type: String, required: true }, // Zip code
  address: { type: String, required: true }, // Full address
  note: { type: String, default: 'Note: You need to select address from your selected country' } // Note for users
}, { _id: false });

// Define the customer address schema
const customerAddressSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }, // Reference to Customer model
  billingAddress: billingAddressSchema,  // Billing address
  shippingAddress: shippingAddressSchema,  // Shipping address
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Create the CustomerAddress model
const CustomerAddress = mongoose.model('CustomerAddress', customerAddressSchema);

export default CustomerAddress;
