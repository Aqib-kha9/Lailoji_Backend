import express from 'express';
import { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory,exportData,updateCategoryStatus } from '../controllers/category.js';
import uploadWithValidation from '../middleware/multer.js'; 
const router = express.Router();

// Create a category (with file upload for logo)
router.post('/',uploadWithValidation,createCategory);

// Get all categories
router.get('/', getAllCategories);

// Get a single category by ID
router.get('/:id', getCategoryById);

// Update a category (with file upload for logo)
router.put('/:id', updateCategory);

// Delete a category
router.delete('/:id', deleteCategory);

router.post("/export", exportData);

// Route to update brand status
router.put('/:categoryId/status', updateCategoryStatus);

export default router;
