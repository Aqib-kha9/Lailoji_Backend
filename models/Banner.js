import mongoose from 'mongoose';

// Define the Banner schema
const bannerSchema = new mongoose.Schema({
  bannerType: {
    type: String,
    enum: ['Main Banner', 'Popup Banner', 'Footer Banner', 'Main Section Banner'],
    required: true,
  },
  bannerUrl: {
    type: String,
    required: true, // URL that the banner will link to
  },
  resourceType: {
    type: String,
    enum: ['Product', 'Category', 'Brand', 'Shop'], // Define allowed resource types
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Reference to the Product model
  },
  bannerImageRatio: {
    type: String,
    required: true,
  },
  publish: { type: Boolean, default: false },
  imageUrl: {
    type: String,
    required: true, // URL or path of the banner image
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Pre-save middleware for bannerImageRatio validation
bannerSchema.pre('save', function (next) {
  const validRatios = {
    'Main Banner': '3:1',
    'Popup Banner': '1:1',
    'Main Section Banner': '4:1',
    'Footer Banner': '2:1',
  };
  
  if (this.isNew || this.isModified('bannerType') || this.isModified('bannerImageRatio')) {
    const expectedRatio = validRatios[this.bannerType];
    if (this.bannerImageRatio !== expectedRatio) {
      return next(new Error(`Please select the correct image ratio: ${expectedRatio} for the ${this.bannerType}`));
    }
  }
  next();
});

// Create a model from the schema
const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
