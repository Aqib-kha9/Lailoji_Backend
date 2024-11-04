import mongoose from 'mongoose';

const flashDealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  bannerImage: {
    type: String, // URL or path for the uploaded image
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Expired'],
    default: 'Active',
  },
  activeProducts: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // Reference to Product model
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to update the flash deal status based on the current date
flashDealSchema.methods.updateStatus = function () {
  const currentDate = new Date();
  this.status = currentDate > this.endDate ? 'Expired' : 'Active';
  return this.status;
};

// Method to add products to the flash deal
flashDealSchema.methods.addProducts = async function (productIds) {
  this.products = [...new Set([...this.products, ...productIds])]; // Ensure no duplicate products
  this.activeProducts = this.products.length;
  return this.save();
};

const FlashDeal = mongoose.model('FlashDeal', flashDealSchema);

export default FlashDeal;
