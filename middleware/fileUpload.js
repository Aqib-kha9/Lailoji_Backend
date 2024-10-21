import multer from 'multer';
import path from 'path';

// Set up storage engine for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Upload directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filter for allowed file types (CSV or Excel)
const fileFilter = (req, file, cb) => {
  const fileTypes = /csv|xlsx/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Only CSV and Excel files are allowed!');
  }
};

// Middleware for file upload
export const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }, // Limit file size to 10MB
  fileFilter: fileFilter
});
