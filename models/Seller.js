import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const sellerSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  address: { type: String },
  phoneNum: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true, match: [/.+\@.+\..+/, 'Please fill a valid email address'] },
  password: { type: String, required: true },
  aadhaar: { type: Number, required: true, unique: true },
  pan: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  otherDocuments: { type: String,},
  role: { type: String, default: 'Seller' }
});

//Hash password before saving 

sellerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
export default mongoose.model('Seller', sellerSchema);
