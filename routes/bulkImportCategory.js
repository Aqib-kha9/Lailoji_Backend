import express from 'express';
import multer from 'multer';
import {bulkImportCategories} from '../controllers/bulkImportCategory.js';

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Folder where files will be uploaded
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Create unique filenames
    }
});
const upload = multer({ storage });

// Bulk import categories route
router.post('/import', upload.single('category-file'), bulkImportCategories);

export default router;
