import multer from 'multer';
import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js'; // Assuming this is properly configured

// Temporary storage for in-memory processing
const memoryStorage = multer.memoryStorage();

// Middleware to validate image aspect ratio (3:1)
const validateImageAspectRatio = async (req, res, next) => {
    const file = req.file;

    if (!file) {
        // If no file is uploaded, skip the aspect ratio validation
        return next();
    }

    try {
        // Extract image metadata
        console.log('Validating image aspect ratio...');
        const metadata = await sharp(file.buffer).metadata();
        const { width, height } = metadata;

        // Calculate aspect ratio
        const aspectRatio = width / height;
        const expectedRatio = 3 / 1;
        const tolerance = 0.10; // Allow a small margin for rounding errors

        console.log(`Image metadata: width=${width}, height=${height}, aspectRatio=${aspectRatio.toFixed(4)}`);

        if (Math.abs(aspectRatio - expectedRatio) > tolerance) {
            console.error('Validation Error: Invalid aspect ratio.');
            return res.status(400).json({
                success: false,
                message: `Image aspect ratio must be 3:1. Received ratio: ${width}:${height} (${aspectRatio.toFixed(4)}).`,
                suggestion: 'Resize the image to dimensions like 600x200 or 1200x400 to meet the 3:1 ratio.',
            });
        }

        console.log('Image aspect ratio is valid.');
        next();
    } catch (error) {
        console.error('Error validating image aspect ratio:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error processing image aspect ratio.',
        });
    }
};

// Multer instance for in-memory validation
const memoryUpload = multer({
    storage: memoryStorage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10 MB limit
}).single('logo');

// Updated upload handler that integrates validation and Cloudinary upload
export const uploadWithValidation = (req, res, next) => {
    console.log('Starting file upload process...');
    console.log(req)
    // If no file is uploaded, just move to the next middleware
    if (!req.file) {
        console.log('No file uploaded, skipping upload process.');
        return next();
    }

    // Log the incoming headers for debugging
    console.log('Incoming Request Headers:', req.headers);

    memoryUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err.message);
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            console.error('Unknown Multer Error:', err.message);
            return res.status(500).json({ success: false, message: err.message });
        }

        // Log the file object after upload to memory storage
        console.log('File successfully uploaded to memory storage.');
        console.log('Uploaded File:', req.file);

        console.log('Validating aspect ratio...');
        // Validate aspect ratio
        validateImageAspectRatio(req, res, async () => {
            try {
                // Use cloudinary's upload stream instead of multer-storage-cloudinary
                console.log('Uploading image to Cloudinary...');

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'Lailoji',
                        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'jfif'],
                        public_id: `logo-${Date.now()}`,
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary Upload Error:', error.message);
                            return res.status(500).json({
                                success: false,
                                message: 'Error uploading image to Cloudinary.',
                            });
                        }

                        console.log('Image successfully uploaded to Cloudinary:', result);
                        req.file = result.secure_url; // Store Cloudinary URL if needed
                        next();
                    }
                );

                // Pipe the buffer directly into Cloudinary's upload stream
                stream.end(req.file.buffer);

            } catch (uploadError) {
                console.error('Unexpected Cloudinary Upload Error:', uploadError.message);
                res.status(500).json({
                    success: false,
                    message: 'Error uploading image to Cloudinary.',
                });
            }
        });
    });
};

export default uploadWithValidation;
