import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js'; // Assuming this is your Cloudinary config file

// Setup Cloudinary storage for image upload
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Cloudinary instance
  params: {
    folder: 'CustomerLogo', // Folder name in Cloudinary
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'], // Supported image formats
    public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Generate unique public ID for each image
    transformation: [
      {
        width: 500,
        height: 500,
        crop: 'limit', // Resize to 500x500px without cropping
      },
    ], // Optional: Resize/crop images before upload
  },
});

// File filter to accept only specific image formats
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|svg|webp|bmp|tiff/; // Define accepted file formats
  const isValidExt = allowedFileTypes.test(file.mimetype); // Check MIME type of the file

  if (isValidExt) {
    cb(null, true); // Allow the file
  } else {
    cb(new Error('Error: Only image files are allowed!'), false); // Reject the file if it doesn't match
  }
};

// Initialize multer with Cloudinary storage, file size limit, and file filter
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Set file size limit to 5MB
  fileFilter, // Use the custom file filter
});

export default upload; // Export the middleware to be used in routes
