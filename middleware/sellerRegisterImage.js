import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Setup multer storage for image and PDF uploads
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Check file type and set the appropriate resource type
        const fileFormat = file.mimetype.split('/')[1];
        const resourceType = fileFormat === 'pdf' ? 'raw' : 'image';

        return {
            folder: 'sellers', // Folder name in Cloudinary
            allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'pdf'], // Allow PDF and image formats
            resource_type: resourceType, // Dynamically set the resource type
            public_id: `${Date.now()}-${file.originalname}`, // Unique name for the file
        };
    },
});

// Initialize multer with storage
const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});

// Middleware to handle multiple file uploads for seller registration files
const uploadSellerFiles = upload.fields([
    { name: 'aadhaarImage', maxCount: 1 },   // Aadhaar image or PDF (single file)
    { name: 'panImage', maxCount: 1 },       // PAN image or PDF (single file)
    { name: 'sellerImage', maxCount: 1 },    // Seller profile image (single file)
    { name: 'shopLogo', maxCount: 1 }        // Other documents, optional (single file)
]);

// Middleware function to upload seller registration files and return URLs
const handleSellerFileUpload = (req, res, next) => {
    uploadSellerFiles(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: 'Error uploading files', error: err.message });
        }

        if (req.files) {
            const fileUrls = {};

            // Handle Aadhaar file URL
            if (req.files.aadhaarImage && req.files.aadhaarImage[0]) {
                fileUrls.aadhaarImage = req.files.aadhaarImage[0].path; // Store Aadhaar file URL
            }

            // Handle PAN file URL
            if (req.files.panImage && req.files.panImage[0]) {
                fileUrls.panImage = req.files.panImage[0].path; // Store PAN file URL
            }

            // Handle Seller image URL
            if (req.files.sellerImage && req.files.sellerImage[0]) {
                fileUrls.sellerImage = req.files.sellerImage[0].path; // Store Seller image URL
            }

            // Handle Other documents URL (optional)
            if (req.files.shopLogo && req.files.shopLogo[0]) {
                fileUrls.shopLogo = req.files.shopLogo[0].path; // Store other document URL
            }

            req.imageUrls = fileUrls;  // Attach the URLs to the request object
            next(); // Proceed to the next middleware
        } else {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }
    });
};

export default handleSellerFileUpload;
