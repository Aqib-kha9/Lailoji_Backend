import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const sellerSchema = new mongoose.Schema({
  fullName: { type: String, required:true},
  shopName: { type: String, required:true},
  address: { type: String ,required:true},
  phoneNum: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true, match: [/.+\@.+\..+/, 'Please fill a valid email address'] },
  password: { type: String, required: true },
  aadhaarImage: { type: String, required: true },
  panImage: { type: String, required: true},
  sellerImage: { type: String, required: true },
  shopLogo: { type: String,},
  status:{type:Boolean,default:false},
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
