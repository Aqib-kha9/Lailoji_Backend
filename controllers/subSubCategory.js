import SubSubCategory from '../models/subSubCategory.js';
import SubCategory from '../models/subCategory.js';
import Category from '../models/Category.js';
import xlsx from 'xlsx';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SubSubCategory
export const createSubSubCategory = async (req, res) => {
    try {
        const { name, subCategoryId, categoryId, priority } = req.body;

        // Ensure the SubCategory and Category exist
        const subCategory = await SubCategory.findById(subCategoryId);
        const category = await Category.findById(categoryId);
        if (!subCategory) return res.status(404).json({ message: 'SubCategory not found' });
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const newSubSubCategory = new SubSubCategory({ name, subCategoryId, categoryId, priority });
        await newSubSubCategory.save();
        res.status(201).json(newSubSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all SubSubCategories
export const getAllSubSubCategories = async (req, res) => {
    try {
        const subSubCategories = await SubSubCategory.find()
            .populate('subCategoryId', 'name')
            .populate('categoryId', 'name').sort({createdAt:-1})
        res.status(200).json(subSubCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get SubSubCategory by ID
export const getSubSubCategoryById = async (req, res) => {
    try {
        const subSubCategory = await SubSubCategory.findById(req.params.id)
            .populate('subCategoryId', 'name')
            .populate('categoryId', 'name');
        if (!subSubCategory) return res.status(404).json({ message: 'SubSubCategory not found' });
        res.status(200).json(subSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update SubSubCategory
export const updateSubSubCategory = async (req, res) => {
    try {
        const { name, subCategoryId, categoryId, priority } = req.body;
        const updatedSubSubCategory = await SubSubCategory.findByIdAndUpdate(
            req.params.id,
            { name, subCategoryId, categoryId, priority },
            { new: true, runValidators: true }
        );
        if (!updatedSubSubCategory) return res.status(404).json({ message: 'SubSubCategory not found' });
        res.status(200).json(updatedSubSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete SubSubCategory
export const deleteSubSubCategory = async (req, res) => {
    try {
        const subSubCategory = await SubSubCategory.findByIdAndDelete(req.params.id);
        if (!subSubCategory) return res.status(404).json({ message: 'SubSubCategory not found' });
        res.status(200).json({ message: 'SubSubCategory deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Export function (Excel or CSV)
export const exportData = async (req, res) => {
    const { type } = req.body; // Get the export type from the request body (excel or csv)

    try {
        // Check if export type is valid
        if (!['excel', 'csv'].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid export type" });
        }

        // Fetch sub-subcategory data from the database
        const subSubCategories = await SubSubCategory.find({}).lean(); // Convert Mongoose documents to plain JavaScript objects

        if (subSubCategories.length === 0) {
            return res.status(404).json({ success: false, message: "No sub-subcategories found" });
        }

        // Fetch subcategories to map their names
        const subCategories = await SubCategory.find({}).lean();
        const subCategoryMap = subCategories.reduce((map, subCategory) => {
            map[subCategory._id.toString()] = subCategory.name; // Map subcategory ID to name
            return map;
        }, {});

        // Fetch main categories to map their names
        const mainCategories = await Category.find({}).lean();
        const mainCategoryMap = mainCategories.reduce((map, category) => {
            map[category._id.toString()] = category.name; // Map main category ID to name
            return map;
        }, {});

        // Format sub-subcategory data with subcategory and main category names
        const formattedSubSubCategories = subSubCategories.map(subSubCategory => ({
            _id: subSubCategory._id.toString(),
            subSubCategoryName: subSubCategory.name, // Sub-subcategory name
            subCategoryName: subSubCategory.subCategoryId ? subCategoryMap[subSubCategory.subCategoryId.toString()] || 'Unknown' : 'Unknown', // Safely map subCategoryId to subCategoryName
            mainCategoryName: subSubCategory.categoryId ? mainCategoryMap[subSubCategory.categoryId.toString()] || 'Unknown' : 'Unknown', // Safely map mainCategoryId to mainCategoryName
            priority: subSubCategory.priority,
            createdAt: subSubCategory.createdAt,
            updatedAt: subSubCategory.updatedAt,
        }));

        let filePath;
        // Ensure the 'exports' directory exists
        const exportDir = path.join(__dirname, 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        if (type === "excel") {
            // Create a new workbook and worksheet with sub-subcategory data
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(formattedSubSubCategories); // Converts formatted sub-subcategory data to Excel sheet
            xlsx.utils.book_append_sheet(wb, ws, "SubSubCategories");

            // Write the Excel file to the 'exports' directory
            filePath = path.join(exportDir, "subsubcategories.xlsx");
            xlsx.writeFile(wb, filePath);

            // Set headers to download the Excel file
            res.setHeader('Content-Disposition', 'attachment; filename="subsubcategories.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        } else if (type === "csv") {
            // Define the correct field names for the CSV header
            const csvFields = [
                { label: "_id", value: "_id" },
                { label: "subSubCategoryName", value: "subSubCategoryName" }, // Corrected field for sub-subcategory name
                { label: "subCategoryName", value: "subCategoryName" }, // Correct field for sub-category name
                { label: "mainCategoryName", value: "mainCategoryName" }, // Correct field for main-category name
                { label: "priority", value: "priority" },
                { label: "createdAt", value: "createdAt" },
                { label: "updatedAt", value: "updatedAt" }
            ];

            // Convert sub-subcategory data to CSV with proper headers
            const csv = new Parser({ fields: csvFields }).parse(formattedSubSubCategories);

            // Write the CSV file to the 'exports' directory
            filePath = path.join(exportDir, "subsubcategories.csv");
            fs.writeFileSync(filePath, csv);

            // Set headers to download the CSV file
            res.setHeader('Content-Disposition', 'attachment; filename="subsubcategories.csv"');
            res.setHeader('Content-Type', 'text/csv');
        }

        // Send the file for download
        return res.download(filePath, (err) => {
            if (err) {
                console.error("File download error:", err);
                return res.status(500).json({ success: false, message: "File download failed" });
            }
        });

    } catch (error) {
        console.error("Export error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Fetch sub-subcategories by subcategory ID
export const getSubSubCategoriesBySubCategoryId = async (req, res) => {
  const  subCategoryId  = req.query.subCategoryId;
  console.log(subCategoryId);
  try {
    const subSubCategories = await SubSubCategory.find({ subCategoryId });
    res.json({ subSubCategories });
  } catch (error) {
    console.error("Error fetching sub-subcategories:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};
