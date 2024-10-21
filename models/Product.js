import mongoose from 'mongoose';

// Define the Product schema
const productSchema = new mongoose.Schema({
  // productName: {
  //   type: String,
  //   required: false,
  // },
  productTitle: {
    type: String,
    required: true,
  },
  productDescription: {
    type: String,
    required: true,
  },
  generalInfo: {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
    subSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubSubCategory', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    productType: { type: String, required: true },
    unit: { type: String, required: true },
    productSKU: { type: String, unique: true, required: true },
  },
  settings: {
    manufacturer: { type: String, required: true },
    madeIn: { type: String, required: true },
    fssaiLicenseNumber: { type: String },
    isReturnable: { type: Boolean, default: false },
    isCODAllowed: { type: Boolean, default: false },
    isCancelable: { type: Boolean, default: false },
    totalAllowedQuantity: { type: Number, default: 0 },
    productStatus: {
      type: String,
      enum: ['Approved', 'Not-Approved'],
      default: 'Not-Approved',
    },
  },
  pricing: {
    unitPrice: { type: Number, required: true },
    minimumOrderQty: { type: Number, default: 1 },
    currentStockQty: { type: Number, default: 0 },
    discountType: { type: String },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    taxCalculation: { type: String },
    shippingCost: { type: Number, default: 0 },
  },
  images: {
    productThumbnail: { type: String, required: true }, // Single thumbnail image
    additionalImages: [{ type: String }], // Array for additional images
  },
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaImage: { type: String },
    indexing: {
      index: { type: Boolean, default: true },
      noIndex: { type: Boolean, default: false },
      noFollow: { type: Boolean, default: false },
      noArchive: { type: Boolean, default: false },
      noSnippet: { type: Boolean, default: false },
      noImageIndex: { type: Boolean, default: false },
      maxSnippet: { type: Number, default: -1 },
      maxVideoPreview: { type: Number, default: -1 },
      maxImagePreview: { type: Number, default: -1 },
    },
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller', // Reference to the Seller model
    required: true,
  },
}, {
  timestamps: true,
});

// Create a model from the schema
const Product = mongoose.model('Product', productSchema);

export default Product;
