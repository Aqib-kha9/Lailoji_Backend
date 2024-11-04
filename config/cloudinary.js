import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // Cloudinary Cloud Name
    api_key: process.env.CLOUDINARY_API_KEY,        // Cloudinary API Key
    api_secret: process.env.CLOUDINARY_API_SECRET,  // Cloudinary API Secret
});

// Export the configured Cloudinary instance
export default cloudinary;
