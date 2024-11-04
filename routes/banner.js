import express from 'express';
import multer from 'multer';
import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  updateBannerStatus
} from '../controllers/banner.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary file storage for uploads

// Route to create a new banner (image upload required)
router.post('/', upload.single('imageFile'), createBanner);

// Route to get all banners
router.get('/', getAllBanners);

// Route to get a banner by ID
router.get('/:id', getBannerById);


router.put("/:id/status", updateBannerStatus);

// Route to update a banner by ID (image upload optional)
router.put('/:id', upload.single('imageFile'), updateBanner);

// Route to delete a banner by ID
router.delete('/:id', deleteBanner);

export default router;
