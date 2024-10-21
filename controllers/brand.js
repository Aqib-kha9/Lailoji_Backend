import Brand from "../models/Brand.js";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import { Parser } from "json2csv";
import { fileURLToPath } from 'url';

// Get the directory name in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Create a new brand
export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    const logo = req.file ? req.file.path : null;
    console.log(logo);
    // Check if logo is provided
    if (!logo) {
      return res.status(400).json({ message: "Brand logo is required" });
    }

    // Create a new brand
    const newBrand = new Brand({ name, logo });
    await newBrand.save();

    res
      .status(201)
      .json({ message: "Brand created successfully", brand: newBrand });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all brands
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a brand
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const logo = req.file ? req.file.path : null;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Update name and logo if provided
    brand.name = name || brand.name;
    if (logo) {
      // Remove the old logo file if a new one is uploaded
      if (brand.logo) {
        fs.unlinkSync(path.resolve(brand.logo));
      }
      brand.logo = logo;
    }

    await brand.save();
    res.status(200).json({ message: "Brand updated successfully", brand });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the brand in one step
    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Remove the logo file if it exists
    if (brand.logo) {
      const logoPath = path.resolve(brand.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to update brand status
export const updateBrandStatus = async (req, res) => {
  const { brandId } = req.params;
  const { status } = req.body;

  try {
    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      { status },
      { new: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res
      .status(200)
      .json({
        message: "Brand status updated successfully",
        brand: updatedBrand,
      });
  } catch (error) {
    console.error("Error updating brand status:", error);
    res.status(500).json({ message: "Internal server error" });
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

    // Fetch brand data from the database
    const brands = await Brand.find({}).lean(); // Convert Mongoose documents to plain JavaScript objects

    if (brands.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No brands found" });
    }

    // Format brand data for export
    const formattedBrands = brands.map((brand, index) => ({
      SL: index + 1, // Serial number starts from 1
      BrandLogo: brand.logo, // Brand logo URL or path
      BrandName: brand.name, // Brand name
      TotalProducts: brand.totalProducts, // Total products
      TotalOrders: brand.totalOrders, // Total orders
      Status: brand.status, // Active/Inactive
      Action: "Edit", // Placeholder for action (customize if needed)
    }));

    let filePath;
    // Ensure the 'exports' directory exists
    const exportDir = path.join(__dirname, "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    

    if (type === "excel") {
      // Create a new workbook and worksheet with brand data
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(formattedBrands); // Converts formatted brand data to Excel sheet
      xlsx.utils.book_append_sheet(wb, ws, "Brands");

      // Write the Excel file to the 'exports' directory
      filePath = path.join(exportDir, "brands.xlsx");
      xlsx.writeFile(wb, filePath);

      // Set headers to download the Excel file
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="brands.xlsx"'
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    } else if (type === "csv") {
      // Define the correct field names for the CSV header
      const csvFields = [
        { label: "SL", value: "SL" },
        { label: "Brand Logo", value: "brandLogo" },
        { label: "Name", value: "name" },
        { label: "Total Products", value: "totalProducts" },
        { label: "Total Orders", value: "totalOrders" },
        { label: "Status", value: "status" },
        { label: "Action", value: "action" },
      ];

      // Convert brand data to CSV with proper headers
      const csv = new Parser({ fields: csvFields }).parse(formattedBrands);

      // Write the CSV file to the 'exports' directory
      filePath = path.join(exportDir, "brands.csv");
      fs.writeFileSync(filePath, csv);

      // Set headers to download the CSV file
      res.setHeader("Content-Disposition", 'attachment; filename="brands.csv"');
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
