import express from 'express';
import { 
    createSubCategory, 
    getAllSubCategories, 
    getSubCategoryById, 
    updateSubCategory, 
    deleteSubCategory ,
    exportData,
    getSubCategoriesByMainCategoryId,
} from '../controllers/subCategory.js';

const router = express.Router();

// Define route for fetching subcategories by mainCategoryId
router.get("/find", getSubCategoriesByMainCategoryId);

// Create SubCategory
router.post('/', createSubCategory);

// Get All SubCategories
router.get('/', getAllSubCategories);

// Get SubCategory by ID
router.get('/:id', getSubCategoryById);

// Update SubCategory
router.put('/:id', updateSubCategory);

// Delete SubCategory
router.delete('/:id', deleteSubCategory);

// Download data as csv or excel

router.post("/export", exportData);



export default router;
