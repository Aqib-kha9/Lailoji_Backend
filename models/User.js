import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false, unique: true },
  password: { type: String, required: false },
  phone: { type: Number, required: true, unique: true },
  role: {
    type: String,
    enum: ['Admin', 'Seller', 'Customer'], // Define available roles
    default: 'Customer' // Default role if none is assigned
  },
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model('User', userSchema);
