import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Set up Cloudinary storage with multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Lailoji', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'jfif'], // Expanded to allow more image types
        public_id: (req, file) => file.fieldname + '-' + Date.now(), // Optional: custom file name
    },
});

// Multer middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit for larger images
});

export default upload;
