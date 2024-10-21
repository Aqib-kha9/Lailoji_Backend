import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId, // Reference to Role model
    ref: 'Role',
  },
  permissions: {
    canManageOffers: { type: Boolean, default: false },
    canManageApprovedProducts: { type: Boolean, default: false },
    canManageSubAdmins: { type: Boolean, default: false },
  },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
