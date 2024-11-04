import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js'; // Ensure this imports your Cloudinary configuration

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flashDeals', // Optional: specify the folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'], // Specify allowed formats
  },
});

// Create the multer instance
const upload = multer({ storage });

// Export the upload middleware for use in your routes
export const uploadFlashDealImage = upload.single('bannerImage');
