import SubCategory from '../models/subCategory.js';
import Category from '../models/Category.js';
import xlsx from 'xlsx';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Get the directory name in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Create SubCategory
export const createSubCategory = async (req, res) => {
    try {
        const { name, categoryId, priority } = req.body;
        
        // Ensure the category exists
        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const newSubCategory = new SubCategory({ name, categoryId, priority });
        await newSubCategory.save();
        res.status(201).json(newSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all SubCategories
export const getAllSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find().populate('categoryId', 'name').sort({ createdAt: -1 }); // populate to show category name
        res.status(200).json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get SubCategory by ID
export const getSubCategoryById = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id).populate('categoryId', 'name');
        if (!subCategory) return res.status(404).json({ message: 'SubCategory not found' });
        res.status(200).json(subCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update SubCategory
export const updateSubCategory = async (req, res) => {
    try {
        const { name, categoryId, priority } = req.body;

        // Fetch the existing subcategory
        const existingSubCategory = await SubCategory.findById(req.params.id);
        if (!existingSubCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        // Prepare the update object
        const updatedData = {
            name: name !== undefined ? name : existingSubCategory.name,
            categoryId: categoryId !== undefined ? categoryId : existingSubCategory.categoryId,
            priority: priority !== undefined ? priority : existingSubCategory.priority,
        };

        // Update the subcategory with the new values or existing values
        const updatedSubCategory = await SubCategory.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete SubCategory
export const deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
        if (!subCategory) return res.status(404).json({ message: 'SubCategory not found',success:false });
        res.status(200).json({ message: 'Sub Category deleted successfully',success:true });
    } catch (error) {
        res.status(500).json({ message: error.message , success:false});
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

        // Fetch subcategory data from the database
        const subCategories = await SubCategory.find({}).lean(); // Convert Mongoose documents to plain JavaScript objects

        if (subCategories.length === 0) {
            return res.status(404).json({ success: false, message: "No subcategories found" });
        }

        // Fetch main categories to map their names
        const mainCategories = await Category.find({}).lean();
        const mainCategoryMap = mainCategories.reduce((map, category) => {
            map[category._id.toString()] = category.name; // Map category ID to name
            return map;
        }, {});

        // Format subcategory data with main category names and handle empty subcategory names
        const formattedSubCategories = subCategories.map(subCategory => ({
            _id: subCategory._id.toString(),
            subCategoryName: subCategory.name ? subCategory.name : "N/A", // Handle empty subcategory names
            mainCategoryName: mainCategoryMap[subCategory.categoryId.toString()] || 'Unknown', // Map categoryId to main category name
            priority: subCategory.priority,
            createdAt: subCategory.createdAt,
            updatedAt: subCategory.updatedAt,
        }));

        let filePath;
        // Ensure the 'exports' directory exists
        const exportDir = path.join(__dirname, 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        if (type === "excel") {
            // Create a new workbook and worksheet with subcategory data
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(formattedSubCategories); // Converts formatted subcategory data to Excel sheet
            xlsx.utils.book_append_sheet(wb, ws, "SubCategories");

            // Write the Excel file to the 'exports' directory
            filePath = path.join(exportDir, "subcategories.xlsx");
            xlsx.writeFile(wb, filePath);

            // Set headers to download the Excel file
            res.setHeader('Content-Disposition', 'attachment; filename="subcategories.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        } else if (type === "csv") {
            // Define CSV headers with "Main Category Name" instead of "categoryId"
            const csvFields = [
                { label: "_id", value: "_id" },
                { label: "Subcategory Name", value: "subCategoryName" }, // Using subCategoryName now with N/A handling
                { label: "Main Category Name", value: "mainCategoryName" }, // Changed from categoryId to Main Category Name
                { label: "Priority", value: "priority" },
                { label: "Created At", value: "createdAt" },
                { label: "Updated At", value: "updatedAt" }
            ];

            // Convert subcategory data to CSV with proper headers
            const csv = new Parser({ fields: csvFields }).parse(formattedSubCategories);

            // Write the CSV file to the 'exports' directory
            filePath = path.join(exportDir, "subcategories.csv");
            fs.writeFileSync(filePath, csv);

            // Set headers to download the CSV file
            res.setHeader('Content-Disposition', 'attachment; filename="subcategories.csv"');
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


// Controller function to fetch subcategories by mainCategoryId
export const getSubCategoriesByMainCategoryId = async (req, res) => {
    const  categoryId  = req.query.categoryId;
    console.log(categoryId);
  
    if (!categoryId) {
      return res.status(400).json({ error: "Main Category ID is required" });
    }
  
    try {
        // Ensure categoryId is valid
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ error: "Invalid category ID" });
  }
      // Fetch subcategories where mainCategoryId matches
      const subCategories = await SubCategory.find({ categoryId: categoryId });
  
      console.log(subCategories);
    //   if (subCategories.length === 0) {
    //     return res.status(404).json({ message: "No subcategories found" });
    //   }
  
      // Return the fetched subcategories
      res.status(200).json({ subCategories });
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "Server error" });
    }
  };

  