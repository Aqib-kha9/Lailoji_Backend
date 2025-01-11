import Category from "../models/Category.js";
import xlsx from "xlsx";
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { v2 as cloudinary } from "cloudinary";

export const createCategory = async (req, res) => {
  const { name, priority } = req.body;
  console.log(req);
  try {
    if (!name || !priority) {
      throw new Error("Name and priority are required fields.");
    }

    const logo = req.file;
    console.log("controller logs", req.file);
    console.log("controller logo file", logo);

    // Create a new category instance
    const newCategory = new Category({ name, logo, priority });

    console.log("New Category:", newCategory);

    // Save the category to the database
    await newCategory.save();

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error.message);

    // Handle image deletion if the image was uploaded
    if (req.file && req.file.filename) {
      try {
        const publicId = req.file.filename; // Cloudinary public_id
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Image deleted from Cloudinary:", result);
      } catch (deleteError) {
        console.error(
          "Error deleting image from Cloudinary:",
          deleteError.message
        );
      }
    }

    // Return the error message to the frontend
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred.",
    });
  }
};

// Get All Categories with Pagination and Search
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const searchQuery = req.query.searchQuery?.trim() || ""; // Get search query
    console.log(limit);
    const skip = (page - 1) * limit; // Calculate the skip value

    // Build a dynamic filter for search
    const filter = searchQuery
      ? { name: { $regex: searchQuery, $options: "i" } } // Case-insensitive search by name
      : {};

    // Fetch categories with the filter, pagination, and sorting
    const categories = await Category.find(filter)
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .skip(skip)
      .limit(limit);

    // Get the total number of categories that match the filter
    const totalCategories = await Category.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(totalCategories / limit);

    // Return paginated response
    res.status(200).json({
      success: true,
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCategories,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Single Category
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
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
    console.log(req.body);
    // Fetch the current category from the database
    const currentCategory = await Category.findById(req.params.id);

    if (!currentCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Set updated fields only if they are provided, else use the current values
    const updatedData = {
      name: name || currentCategory.name, // Use provided name or keep existing
      priority: priority || currentCategory.priority, // Use provided priority or keep existing
      status: status !== undefined ? status : currentCategory.status, // Use provided status or keep existing
      logo: req.file ? req.file : currentCategory.logo, // If a new logo is uploaded, update it; otherwise, keep the existing one
    };

    // Update the category with the new or existing data
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Delete Category and Associated Image from Cloudinary
export const deleteCategory = async (req, res) => {
  try {
    // Find the category by ID
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    if (category.logo) {
      const logoUrl = category.logo;

      // Extract the correct public_id for Cloudinary
      const publicId = getPublicIdForDeletion(logoUrl);

      if (!publicId) {
        console.error("Failed to extract public ID from URL:", logoUrl);
      } else {
        console.log(`Attempting to delete image with public ID: ${publicId}`);
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          console.log("Cloudinary Deletion Result:", result);
        } catch (error) {
          console.error("Error deleting image from Cloudinary:", error.message);
        }
      }
    }

    // Function to extract the correct public ID for Cloudinary
    function getPublicIdForDeletion(url) {
      const uploadIndex = url.indexOf("/upload/");
      if (uploadIndex === -1) return null; // Invalid URL

      // Get everything after '/upload/' and remove versioning and extension
      const path = url.substring(uploadIndex + "/upload/".length);
      const parts = path.split("/");
      parts.shift(); // Remove the version part (e.g., "v1736191710")
      return parts.join("/").split(".")[0]; // Remove the file extension
    }

    // Delete the category from the database
    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category and its image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting category and associated image",
    });
  }
};

// Export function (Excel or CSV)
export const exportData = async (req, res) => {
  const { type } = req.body; // Get the export type from the request body (excel or csv)

  try {
    // Check if export type is valid
    if (!["excel", "csv"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid export type" });
    }

    // Fetch category data from the database, including the _id field
    const categories = await Category.find({})
      .select("_id name priority logo status createdAt updatedAt") // Ensure _id is included
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    if (categories.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No categories found" });
    }

    // Convert the _id field from ObjectId to string for each category
    const formattedCategories = categories.map((category) => ({
      ...category,
      _id: category._id.toString(), // Convert _id to string
    }));

    let filePath;
    // Ensure the 'exports' directory exists
    const exportDir = path.join(__dirname, "exports");
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
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="categories.xlsx"'
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    } else if (type === "csv") {
      // Convert category data to CSV
      const csv = new Parser({
        fields: [
          "_id",
          "name",
          "priority",
          "logo",
          "status",
          "createdAt",
          "updatedAt",
        ],
      }).parse(formattedCategories); // Include _id and other fields

      // Write the CSV file to the 'exports' directory
      filePath = path.join(exportDir, "categories.csv");
      fs.writeFileSync(filePath, csv);

      // Set headers to download the CSV file
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="categories.csv"'
      );
      res.setHeader("Content-Type", "text/csv");
    }

    // Send the file for download
    return res.download(filePath, (err) => {
      if (err) {
        console.error("File download error:", err);
        return res
          .status(500)
          .json({ success: false, message: "File download failed" });
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
      return res.status(404).json({ message: "Brand not found" });
    }

    res.status(200).json({
      message: "Category status updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating Category status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
