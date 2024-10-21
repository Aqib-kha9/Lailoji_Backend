import xlsx from 'xlsx';
import fs from 'fs';
import Category from '../models/Category.js';
import SubCategory from '../models/subCategory.js';
import SubSubCategory from '../models/subSubCategory.js'; // Import the Sub Sub Category model


export const bulkImportCategories = async (req, res) => {
    try {
        // Get the uploaded file path
        const filePath = req.file.path;

        // Parse the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Prepare to store categories
        const categories = [];

        for (const item of data) {
            const { name, priority, logo, isActive } = item; // Assuming these are the fields in the file
            console.log(name,priority,logo,isActive);
            // Check if the category already exists
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ message: `Category '${name}' already exists.` });
            }

            // Prepare new category data
            const newCategoryData = {
                name,
                priority,
                logo, // URL of the uploaded image
                isActive: isActive || 'active', // Default to 'active' if not provided
            };

            categories.push(newCategoryData);
        }

        // Insert categories in bulk
        await Category.insertMany(categories);

        // Delete the file after processing
        fs.unlinkSync(filePath);

        res.status(201).json({ message: 'Categories imported successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: error.message });
    }
};

// export const bulkImportCategories = async (req, res) => {
//     try {
//         // Get the uploaded file path
//         const filePath = req.file.path;

//         // Parse the Excel file
//         const workbook = xlsx.readFile(filePath);
//         const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
//         const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//         // Prepare to store sub-sub-categories
//         const subSubCategories = [];

//         for (const item of data) {
//             const { name, priority, categoryName, subCategoryName } = item; // Assuming this is the file format

//             // Check if the category exists
//             const category = await Category.findOne({ name: categoryName });
//             if (!category) {
//                 return res.status(400).json({ message: `Category '${categoryName}' not found.` });
//             }

//             // Check if the sub-category exists
//             const subCategory = await SubCategory.findOne({ name: subCategoryName, categoryId: category._id });
//             if (!subCategory) {
//                 return res.status(400).json({ message: `Sub-category '${subCategoryName}' not found in category '${categoryName}'.` });
//             }

//             // Prepare new sub-sub-category data
//             const newSubSubCategoryData = {
//                 name,
//                 priority,
//                 categoryId: category._id,
//                 subCategoryId: subCategory._id,
//             };

//             subSubCategories.push(newSubSubCategoryData);
//         }

//         // Insert sub-sub-categories in bulk
//         await SubSubCategory.insertMany(subSubCategories);

//         // Delete the file after processing
//         fs.unlinkSync(filePath);

//         res.status(201).json({ message: 'Sub Sub Categories imported successfully' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };
