import Category from '../models/Category.js';
import xlsx from 'xlsx';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Category
export const createCategory = async (req, res) => {
    try {
        const { name, priority } = req.body;
        const logo = req.file ? req.file.path : ''; // Assuming multer for file upload
        console.log(req.body);
        console.log(req.file);

        const newCategory = new Category({
            name,
            priority,
            logo,
        });
        console.log("new category",newCategory);
        await newCategory.save();
        res.status(201).json({ success: true, message: 'Category created successfully', category: newCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Categories
export const getAllCategories = async (req, res) => {
    try {
        // Fetch categories sorted by creation date (earliest created first)
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single Category
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Category
export const updateCategory = async (req, res) => {
    try {
        const { name, priority, status } = req.body;

        // Fetch the current category from the database
        const currentCategory = await Category.findById(req.params.id);

        if (!currentCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Set updated fields only if they are provided, else use the current values
        const updatedData = {
            name: name || currentCategory.name,              // Use provided name or keep existing
            priority: priority || currentCategory.priority,  // Use provided priority or keep existing
            status: status !== undefined ? status : currentCategory.status, // Use provided status or keep existing
            logo: req.file ? req.file.path : currentCategory.logo, // If a new logo is uploaded, update it; otherwise, keep the existing one
        };

        // Update the category with the new or existing data
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        res.status(200).json({ success: true, message: 'Category updated successfully', category: updatedCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Delete Category
export const deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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

        // Fetch category data from the database, including the _id field
        const categories = await Category.find({})
            .select('_id name priority logo status createdAt updatedAt') // Ensure _id is included
            .lean(); // Convert Mongoose documents to plain JavaScript objects

        if (categories.length === 0) {
            return res.status(404).json({ success: false, message: "No categories found" });
        }

        // Convert the _id field from ObjectId to string for each category
        const formattedCategories = categories.map(category => ({
            ...category,
            _id: category._id.toString(), // Convert _id to string
        }));

        let filePath;
        // Ensure the 'exports' directory exists
        const exportDir = path.join(__dirname, 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        if (type === "excel") {
            // Create a new workbook and worksheet with category data
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(formattedCategories); // Converts formatted category data to Excel sheet
            xlsx.utils.book_append_sheet(wb, ws, "Categories");

            // Write the Excel file to the 'exports' directory
            filePath = path.join(exportDir, "categories.xlsx");
            xlsx.writeFile(wb, filePath);

            // Set headers to download the Excel file
            res.setHeader('Content-Disposition', 'attachment; filename="categories.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        } else if (type === "csv") {
            // Convert category data to CSV
            const csv = new Parser({ fields: ['_id', 'name', 'priority', 'logo', 'status', 'createdAt', 'updatedAt'] }).parse(formattedCategories); // Include _id and other fields

            // Write the CSV file to the 'exports' directory
            filePath = path.join(exportDir, "categories.csv");
            fs.writeFileSync(filePath, csv);

            // Set headers to download the CSV file
            res.setHeader('Content-Disposition', 'attachment; filename="categories.csv"');
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


// Controller to update brand status
export const updateCategoryStatus = async (req, res) => {
    const { categoryId } = req.params;
    const { status } = req.body;
  
    try {
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { status },
        { new: true }
      );
  
      if (!updatedCategory) {
        return res.status(404).json({ message: 'Brand not found' });
      }
  
      res.status(200).json({ message: 'Category status updated successfully', category: updatedCategory });
    } catch (error) {
      console.error('Error updating Category status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };