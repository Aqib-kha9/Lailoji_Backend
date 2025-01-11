import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Setup Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'refund-requests', // Cloudinary folder for refund-related files
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp'], // Allowed formats
    resource_type: 'image', // All files are treated as images
    public_id: `${Date.now()}-${file.originalname}`, // Unique file name
  }),
});

// Initialize multer with Cloudinary storage
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
});

// Define file upload fields
export const uploadRefundFiles = upload.array('refundImages', 3); // Accept up to 3 images

// Middleware for handling refund file uploads
export const handleRefundFileUpload = (req, res, next) => {
  uploadRefundFiles(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'Error uploading files',
        error: err.message,
      });
    }

    if (req.files) {
      // Extract uploaded image URLs
      req.imageUrls = req.files.map((file) => file.path); // Cloudinary URLs
    } else {
      req.imageUrls = []; // No files uploaded
    }

    next(); // Proceed to the controller
  });
};
