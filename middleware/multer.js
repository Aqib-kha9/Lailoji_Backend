import cloudinary from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // Cloudinary Cloud Name
    api_key: process.env.CLOUDINARY_API_KEY,        // Cloudinary API Key
    api_secret: process.env.CLOUDINARY_API_SECRET,  // Cloudinary API Secret
});

// Set up Cloudinary storage with multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
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
