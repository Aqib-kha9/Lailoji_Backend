import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Setup multer storage for image uploads
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sellers', // Folder name in Cloudinary
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'], // Allowing more image formats
        public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Unique name for the file
    },
});

// Initialize multer with storage
const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});

// Middleware to handle multiple file uploads for seller registration images
const uploadSellerImages = upload.fields([
    { name: 'aadhaarImage', maxCount: 1 },   // Aadhaar image (single image)
    { name: 'panImage', maxCount: 1 },        // PAN image (single image)
    { name: 'sellerImage', maxCount: 1 },     // Seller profile image (single image)
    { name: 'shopLogo', maxCount: 1 }   // Other documents (optional, single image)
]);

// Middleware function to upload seller registration images and return URLs
const handleSellerImageUpload = (req, res, next) => {
    uploadSellerImages(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: 'Error uploading images', error: err.message });
        }

        if (req.files) {
            const imageUrls = {};

            // Handle Aadhaar image URL
            if (req.files.aadhaarImage && req.files.aadhaarImage[0]) {
                imageUrls.aadhaarImage = req.files.aadhaarImage[0].path; // Store Aadhaar image URL
            }

            // Handle PAN image URL
            if (req.files.panImage && req.files.panImage[0]) {
                imageUrls.panImage = req.files.panImage[0].path; // Store PAN image URL
            }

            // Handle Seller image URL
            if (req.files.sellerImage && req.files.sellerImage[0]) {
                imageUrls.sellerImage = req.files.sellerImage[0].path; // Store Seller image URL
            }

            // Handle Other documents URL (optional)
            if (req.files.shopLogo && req.files.shopLogo[0]) {
                imageUrls.shopLogo = req.files.shopLogo[0].path; // Store other document URL
            }

            req.imageUrls = imageUrls; // Attach the URLs to the request object
            next(); // Proceed to the next middleware
        } else {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }
    });
};

export default handleSellerImageUpload;
