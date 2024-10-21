import mongoose from 'mongoose';

// Define the Brand schema
const brandSchema = new mongoose.Schema({
  logo: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  totalProducts: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Inactive',
  },
}, {
  timestamps: true,
});

// Create a model from the schema
const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
