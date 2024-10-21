import express from 'express';
import upload from '../middleware/brandImage.js'; // Middleware to handle file uploads
import { createBrand, getAllBrands, updateBrand, deleteBrand,updateBrandStatus,exportData } from '../controllers/brand.js';

const router = express.Router();

// Create a new brand
router.post('/', upload.single('logo'), createBrand);

// Get all brands
router.get('/', getAllBrands);

// Update a brand by id
router.put('/:id', upload.single('logo'), updateBrand);

// Delete a brand by id
router.delete('/:id', deleteBrand);

// Route to update brand status
router.put('/:brandId/status', updateBrandStatus);

// Download data as csv or excel

router.post("/export", exportData);

export default router;
