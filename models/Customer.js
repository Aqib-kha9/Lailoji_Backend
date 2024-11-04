import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  firstName: { type: String, default: null }, // Default null if not provided
  lastName: { type: String, default: null },  // Default null if not provided
  phoneNumber: { type: String, unique: true, required: true }, // Required phone number
  email: { type: String, unique: true, default: null }, // Default null if not provided
  password: { type: String, required: true, minlength: 8 }, // Required password
  joinedDate: { type: Date, default: Date.now }, // Joined date
  isBlock: { 
    type: String, 
    enum: ['Block', 'Unblock'], 
    default: 'Unblock', 
    required: true 
  }, // Block/Unblock status
  customerLogo: { type: String, default: null } // Default null if not provided
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
