import express from 'express';
import { 
    createSubSubCategory, 
    getAllSubSubCategories, 
    getSubSubCategoryById, 
    updateSubSubCategory, 
    deleteSubSubCategory,
    exportData,
    getSubSubCategoriesBySubCategoryId,
} from '../controllers/subSubCategory.js';

const router = express.Router();

// Get sub-subcategories by subcategory ID
router.get('/find', getSubSubCategoriesBySubCategoryId);
// Create SubSubCategory
router.post('/', createSubSubCategory);

// Get All SubSubCategories
router.get('/', getAllSubSubCategories);

// Get SubSubCategory by ID
router.get('/:id', getSubSubCategoryById);

// Update SubSubCategory
router.put('/:id', updateSubSubCategory);

// Delete SubSubCategory
router.delete('/:id', deleteSubSubCategory);

// Download data as csv or excel

router.post("/export", exportData);



export default router;
