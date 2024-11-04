import mongoose from 'mongoose';

// Define the schema
const couponSchema = new mongoose.Schema({
  couponType: {
    type: String,
    required: true,
    enum: ['discountOnPurchase', 'freeDelivery', 'firstOrder'],
  },
  title: {
    type: String,
    required: [true, 'Coupon title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
  },
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    minlength: [6, 'Code must be at least 6 characters long'],
    default: function () {
      return Math.random().toString(36).substring(2, 12);
    },
  },
  creatorType: {
    type: String,
    required: true,
    enum: ['admin', 'seller'],
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'creatorType',
  },
  applicableProducts: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    default: [],
  },
  applyToAllProducts: {
    type: Boolean,
    default: true,
  },
  customer: {
    type: String,
    required: true,
    enum: ['all', 'specific'],
    default: 'all',
  },
  specificCustomers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
      },
    ],
    default: [],
  },
  limitPerUser: {
    type: Number,
    required: [true, 'Usage limit is required'],
    min: [1, 'Limit must be at least 1'],
    default: 1,
  },
  discountType: {
    type: String,
    required: true,
    enum: ['amount', 'percentage'],
  },
  discountAmount: {
    type: Number,
    required: [true, 'Discount amount is required'],
    min: [1, 'Discount must be at least 1'],
  },
  minPurchase: {
    type: Number,
    required: [true, 'Minimum purchase amount is required'],
    min: [0, 'Minimum purchase must be at least 0'],
    default: 0,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  expireDate: {
    type: Date,
    required: [true, 'Expiration date is required'],
  },
  applyToAllCategories: {
    type: Boolean,
    default: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function () {
      // Ensure this.applicableProducts is defined before checking length
      return !this.applyToAllCategories && (this.applicableProducts && this.applicableProducts.length > 0);
    },
  },
  status: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Middleware for update operations
couponSchema.pre('findOneAndUpdate', function (next) {
  this.options.runValidators = true; // Ensure validators run on updates
  next();
});

// Export the Coupon model
const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
