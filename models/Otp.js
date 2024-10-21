import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: false },
  code: { type: String, required: true },
  phone: {type: Number, required: true},
  name:{type:String,required:false},
  password:{type:String,required:false},
  createdAt: { type: Date, default: Date.now, expires: '5m' }, // OTP expires in 5 minutes
});

export default mongoose.model('OTP', otpSchema);
