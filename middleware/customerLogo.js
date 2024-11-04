
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import cloudinary from '../config/cloudinary.js';



// Setup Cloudinary storage for image upload
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'CustomerLogo', // Folder name in Cloudinary
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'], // Supported image formats
        public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Generate unique filename
        transformation: [{ width: 500, height: 500, crop: 'limit' }],  // Optional: Resize/crop images before upload
    },
});

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|svg|webp|bmp|tiff/;
    const extname = allowedFileTypes.test(file.mimetype); // Validate mimetype

    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only image files are allowed!'));
    }
};

// Initialize multer with storage and file filter
const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Set file size limit to 5MB
    fileFilter, // Use the custom file filter
});

export default upload;
