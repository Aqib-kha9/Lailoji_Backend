import cloudinary from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // Cloudinary Cloud Name
    api_key: process.env.CLOUDINARY_API_KEY,        // Cloudinary API Key
    api_secret: process.env.CLOUDINARY_API_SECRET,  // Cloudinary API Secret
});

// Setup multer storage for logo upload
const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
        folder: 'brands', // Folder name in Cloudinary
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'], // Allowing more image formats
        // Optionally, you can set the public_id
        public_id: (req, file) => `${Date.now()}-${file.originalname}`, // This will create a unique name
    },
});

// File filter to accept only images
// const fileFilter = (req, file, cb) => {
//     const fileTypes = /jpeg|jpg|png/;
//     const mimeType = fileTypes.test(file.mimetype);
//     console.log(mimeType);
//     if (mimeType) {
//         return cb(null, true);
//     } else {
//         cb(new Error('Error: Images Only!'));
//     }
// };

// Initialize multer with storage and file filter
const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
    // fileFilter,
});

export default upload;
