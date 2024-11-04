
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import cloudinary from '../config/cloudinary.js';


// Set up Cloudinary storage with multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Lailoji', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png'], // Allowed file types
        public_id: (req, file) => file.fieldname + '-' + Date.now(), // Optional: custom file name
    },
});

// Check file type (optional as Cloudinary validates file types)
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Only images are allowed!');
    }
};

// Multer middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: fileFilter, // Optional file type filter
});

export default upload;
