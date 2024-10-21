import cloudinary from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // Cloudinary Cloud Name
    api_key: process.env.CLOUDINARY_API_KEY,        // Cloudinary API Key
    api_secret: process.env.CLOUDINARY_API_SECRET,  // Cloudinary API Secret
});

// Setup multer storage for image uploads
const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
        folder: 'brands', // Folder name in Cloudinary
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'], // Allowing more image formats
        public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Unique name for the file
    },
});

// Initialize multer with storage
const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});

// Middleware to handle multiple file uploads (for thumbnail, metaImage, and additionalImages)
const uploadMultiple = upload.fields([
    { name: 'productThumbnail', maxCount: 1 },      // 'thumbnail' field (single image)
    { name: 'metaImage', maxCount: 1 },      // 'metaImage' field (single image)
    { name: 'additionalImages', maxCount: 10 } // 'additionalImages' field (up to 10 images)
]);

// Middleware function to upload images and return URLs
const handleImageUpload = (req, res, next) => {
    uploadMultiple(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: 'Error uploading images', error: err.message });
        }

        if (req.files) {
            const imageUrls = {};

            // Handle thumbnail URL
            if (req.files.productThumbnail && req.files.productThumbnail[0]) {
                imageUrls.productThumbnail = req.files.productThumbnail[0].path; // Store thumbnail URL
            }

            // Handle metaImage URL
            if (req.files.metaImage && req.files.metaImage[0]) {
                imageUrls.metaImage = req.files.metaImage[0].path; // Store metaImage URL
            }

            // Handle additional images URLs
            if (req.files.additionalImages && req.files.additionalImages.length > 0) {
                imageUrls.additionalImages = req.files.additionalImages.map(file => file.path); // Store additional image URLs
            }

            req.imageUrls = imageUrls; // Attach the URLs to the request object
            next(); // Proceed to the next middleware
        } else {
            return res.status(400).json({ message: 'No files were uploaded.' });
        }
    });
};

export default handleImageUpload;
