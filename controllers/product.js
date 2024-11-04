import Product from '../models/Product.js'; // Adjust the path as needed
import Seller from '../models/Seller.js';
import fs from 'fs';
import xlsx from 'xlsx';
import path from 'path';
import { Parser } from 'json2csv'; // Ensure you have this package installed
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Get the directory name in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const addProduct = async (req, res) => {
  try {
    // Check if the thumbnail is uploaded via multer
    const productThumbnail = req.imageUrls.productThumbnail; // Access the file path (assuming you're using Multer for file uploads)

    // Handle multiple additional images (if applicable)
    let additionalImages = [];
    if (req.imageUrls && req.imageUrls.additionalImages) {
      additionalImages = req.files.additionalImages.map(file => file.path);
    }

    // Destructure the incoming data from the request body
    const {
      productTitle,
      productDescription,
      generalInfo: {
        category,
        subCategory,
        subSubCategory,
        brand,
        productType,
        unit,
        productSKU
      },
      settings: {
        manufacturer,
        madeIn,
        fssaiLicenseNumber,
        isReturnable,
        isCODAllowed,
        isCancelable,
        totalAllowedQuantity,
        productStatus
      },
      pricing: {
        unitPrice,
        minimumOrderQty,
        currentStockQty,
        discountType,
        discountAmount,
        taxAmount,
        taxCalculation,
        shippingCost
      },
      seo = {},
      indexing = {},
      seller
    } = req.body;

    console.log(req.body)

    // Validate productSKU and other required fields
    if (!productSKU || !productThumbnail || !productTitle || !unitPrice) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields: {
          productSKU: !productSKU ? 'productSKU is required' : undefined,
          productThumbnail: !productThumbnail ? 'productThumbnail is required' : undefined,
          productTitle: !productTitle ? 'productTitle is required' : undefined,
          unitPrice: !unitPrice ? 'unitPrice is required' : undefined
        }
      });
    }

    // Create a new product instance
    const newProduct = new Product({
      productTitle,
      productDescription,
      generalInfo: {
        category,
        subCategory,
        subSubCategory,
        brand,
        productType,
        unit,
        productSKU
      },
      settings: {
        manufacturer,
        madeIn,
        fssaiLicenseNumber,
        isReturnable,
        isCODAllowed,
        isCancelable,
        totalAllowedQuantity,
        productStatus
      },
      pricing: {
        unitPrice,
        minimumOrderQty,
        currentStockQty,
        discountType,
        discountAmount
      },
      stock: {
        minimumOrderQty,
        currentStockQty
      },
      discount: {
        discountType,
        discountAmount
      },
      tax: {
        taxAmount,
        taxCalculation
      },
      shippingCost,
      images: {
        productThumbnail, // Use the file path for the thumbnail
        additionalImages // Additional images array
      },
      seller,
      isApproved: false
    });

    console.log("new Product saved: ",newProduct);
    // Save the product to the database
    const savedProduct = await newProduct.save();

    // Return the saved product as a response
    return res.status(201).json({
      message: 'Product added successfully',
      product: savedProduct
    });
  } catch (error) {
    // Specific error handling for duplicate SKU
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate productSKU. Please use a unique SKU.',
        error: error.message
      });
    }

    console.error('Error adding product:', error);
    return res.status(500).json({
      message: 'Error adding product',
      error: error.message
    });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    // Fetch products from the database and populate multiple fields
    const products = await Product.find()
      .populate('generalInfo.category') // Populate the category field
      .populate('generalInfo.subCategory') // Populate the subCategory field
      .populate('generalInfo.subSubCategory') // Populate the subSubCategory field
      .populate('generalInfo.brand') // Populate the brand field
      .populate('seller'); // Populate the seller field

    // Check if products are found
    if (!products || products.length === 0) {
      return res.status(404).json({
        message: 'No products found',
      });
    }

    // Send response with products
    return res.status(200).json({
      message: 'Products fetched successfully',
      products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      message: 'Error fetching products',
      error: error.message,
    });
  }
};





export const getProductById = async (req, res) => {
  try {
    const { id } = req.params; // Get the product ID from the request parameters

    // Fetch the product by ID and populate the brand and category data
    const product = await Product.findById(id)
      .populate('generalInfo.brand', 'name') // Replace 'name' with the field(s) you want from the Brand model
      .populate('generalInfo.category', 'name') // Replace 'name' with the field(s) you want from the Category model
      .populate('generalInfo.subCategory', 'name') // If you also want to include subCategory
      .populate('generalInfo.subSubCategory', 'name'); // If you also want to include subSubCategory

    // Check if the product is found
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    // Send response with the product
    return res.status(200).json({
      message: 'Product fetched successfully',
      product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      message: 'Error fetching product',
      error: error.message,
    });
  }
};



// Toggle Featured Status
export const toggleFeaturedStatus = async (req, res) => {
  const  product  = req.params;
  const productId = product.id;

  try {
    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Toggle the isFeatured field
    product.isFeatured = !product.isFeatured;

    // Save the updated product
    await product.save();

    return res.status(200).json({
      message: 'Featured status updated successfully',
      product,
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    return res.status(500).json({
      message: 'Error updating featured status',
      error: error.message,
    });
  }
};

// Helper function to check for valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Fetch products by seller and category
export const getProductsBySellerAndCategory = async (req, res) => {
  const { creatorId, categoryId, creatorType } = req.query;
  // console.log(req.query);

  try {
    // Check if parameters are provided
    if (!creatorId || !categoryId || !creatorType) {
      return res.status(400).json({ message: 'creatorId, categoryId, and creatorType are required.' });
    }

    // Validate ObjectId format for creatorId and categoryId
    if (!isValidObjectId(creatorId) || !isValidObjectId(categoryId)) {
      return res.status(400).json({ message: 'Invalid creatorId or categoryId format.' });
    }

    // Convert creatorId and categoryId to ObjectId
    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
    
    let products;
    
    // If creatorType is 'seller', find products associated with the seller and category
    if (creatorType === 'seller') {
      const sellerId = new mongoose.Types.ObjectId(creatorId);
      products = await Product.find({
        seller: sellerId,
        'generalInfo.category': categoryObjectId,
      }).populate('generalInfo.category generalInfo.subCategory generalInfo.subSubCategory generalInfo.brand seller');
    } 
    // If creatorType is 'admin', fetch all products under the category regardless of seller
    else if (creatorType === 'admin') {
      products = await Product.find({
        'generalInfo.category': categoryObjectId,
      }).populate('generalInfo.category generalInfo.subCategory generalInfo.subSubCategory generalInfo.brand seller');
    } else {
      return res.status(400).json({ message: 'Invalid creatorType.' });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products by seller and category:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};





// Controller to get all products for a seller

// export const getSellerProducts = async (req, res) => {
//   try {
//     const sellerId = req.seller._id;

//     // Find all products that belong to the authenticated seller
//     const products = await Product.find({ seller: sellerId });

//     if (products.length === 0) {
//       return res.status(404).json({ message: 'No products found for this seller.' });
//     }

//     return res.status(200).json({ message: 'Products retrieved successfully', products });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Error retrieving products', error: error.message });
//   }
// };

// Controller to update product details

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller._id;

    // Destructure the fields that are allowed to be updated from the request body
    const updatedFields = req.body;

    // Find the product by its ID and ensure it belongs to the authenticated seller
    let product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or you do not have permission to update this product' });
    }

    // Update the product fields with the provided data
    Object.keys(updatedFields).forEach(key => {
      if (updatedFields[key] !== undefined) {
        product[key] = updatedFields[key];
      }
    });

    // Save the updated product
    const updatedProduct = await product.save();

    return res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    // Find and delete the product by productId
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
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

    // Fetch product data from the database
    const products = await Product.find({}).lean(); // Convert Mongoose documents to plain JavaScript objects

    if (products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    // Format product data for export
    const formattedProducts = products.map((product, index) => ({
      SL: index + 1, // Serial number starts from 1
      ProductName: product.productTitle, // Product name
      ProductType: product.generalInfo.productType, // Product type
      UnitPrice: product.pricing.unitPrice, // Unit price
      ShowAsFeatured: product.isFeatured ? "Yes" : "No", // Convert boolean to Yes/No
      ProductStatus: product.settings.productStatus ? "Active" : "Inactive", // Convert boolean to Active/Inactive
      Action: "Edit", // Placeholder for action (customize if needed)
    }));

    let filePath;
    // Ensure the 'exports' directory exists
    const exportDir = path.join(__dirname, "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    if (type === "excel") {
      // Create a new workbook and worksheet with product data
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(formattedProducts); // Converts formatted product data to Excel sheet
      xlsx.utils.book_append_sheet(wb, ws, "Products");

      // Write the Excel file to the 'exports' directory
      filePath = path.join(exportDir, "products.xlsx");
      xlsx.writeFile(wb, filePath);

      // Set headers to download the Excel file
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="products.xlsx"'
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    } else if (type === "csv") {
      // Define the correct field names for the CSV header
      const csvFields = [
        { label: "SL", value: "SL" },
        { label: "Product Name", value: "ProductName" },
        { label: "Product Type", value: "ProductType" },
        { label: "Unit Price", value: "UnitPrice" },
        { label: "Show As Featured", value: "ShowAsFeatured" },
        { label: "Active Status", value: "ProductStatus" },
        { label: "Action", value: "Action" },
      ];

      // Convert product data to CSV with proper headers
      const csv = new Parser({ fields: csvFields }).parse(formattedProducts);

      // Write the CSV file to the 'exports' directory
      filePath = path.join(exportDir, "products.csv");
      fs.writeFileSync(filePath, csv);

      // Set headers to download the CSV file
      res.setHeader("Content-Disposition", 'attachment; filename="products.csv"');
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


export const bulkImportProducts = async (req, res) => {
  try {
      // Get the uploaded file path
      const filePath = req.file.path;

      // Parse the Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Check if the data array is empty
      if (!data || data.length === 0) {
          return res.status(400).json({ message: 'No data found to import.' });
      }

      console.log('Parsed Excel Data:', data); // Log the parsed data

      // Prepare to store products
      const products = [];

      for (const item of data) {
          if (!item) {
              console.error('Received undefined item in data array');
              continue; // Skip this iteration if item is undefined
          }

          console.log('Processing item:', item); // Log the current item

          const {
              productTitle,
              productDescription,
              isFeatured,
              seller,
              'generalInfo.category': category,
              'generalInfo.subCategory': subCategory,
              'generalInfo.subSubCategory': subSubCategory,
              'generalInfo.brand': brand,
              'generalInfo.productType': productType,
              'generalInfo.unit': unit,
              'generalInfo.productSKU': productSKU,
              'settings.manufacturer': manufacturer,
              'settings.madeIn': madeIn,
              'settings.fssaiLicenseNumber': fssaiLicenseNumber,
              'settings.isReturnable': isReturnable,
              'settings.isCODAllowed': isCODAllowed,
              'settings.isCancelable': isCancelable,
              'settings.totalAllowedQuantity': totalAllowedQuantity,
              'settings.productStatus': productStatus,
              'pricing.unitPrice': unitPrice,
              'pricing.minimumOrderQty': minimumOrderQty,
              'pricing.currentStockQty': currentStockQty,
              'pricing.discountType': discountType,
              'pricing.discountAmount': discountAmount,
              'pricing.taxAmount': taxAmount,
              'pricing.taxCalculation': taxCalculation,
              'pricing.shippingCost': shippingCost,
              'images.productThumbnail': productThumbnail,
              additionalImage_1,
              additionalImage_2,
              'seo.metaTitle': metaTitle,
              'seo.metaDescription': metaDescription,
              'seo.metaImage': metaImage,
          } = item;

          // Log the SKU being processed
          console.log(`Processing SKU: ${productSKU}`);

          // Check if the product SKU is valid
          if (!productSKU) {
              console.log('SKU is undefined for item:', item);
              continue; // Skip processing this item
          }

          // Check if the product SKU already exists
          const existingProduct = await Product.findOne({ productSKU });
          if (existingProduct) {
              return res.status(400).json({ message: `Product with SKU '${productSKU}' already exists.` });
          }

          // Prepare new product data
          const newProductData = {
              productTitle,
              productDescription,
              isFeatured: isFeatured || false, // Default to false if not provided
              generalInfo: {
                  category: new mongoose.Types.ObjectId(category), // Assuming category is provided as an ID string
                  subCategory: new mongoose.Types.ObjectId(subCategory),
                  subSubCategory: new mongoose.Types.ObjectId(subSubCategory),
                  brand: new mongoose.Types.ObjectId(brand),
                  productType,
                  unit,
                  productSKU,
              },
              settings: {
                  manufacturer,
                  madeIn,
                  fssaiLicenseNumber,
                  isReturnable: isReturnable || false,
                  isCODAllowed: isCODAllowed || false,
                  isCancelable: isCancelable || false,
                  totalAllowedQuantity: totalAllowedQuantity || 0,
                  productStatus: productStatus || 'Not-Approved',
              },
              pricing: {
                  unitPrice,
                  minimumOrderQty: minimumOrderQty || 1,
                  currentStockQty: currentStockQty || 0,
                  discountType,
                  discountAmount: discountAmount || 0,
                  taxAmount: taxAmount || 0,
                  taxCalculation,
                  shippingCost: shippingCost || 0,
              },
              images: {
                  productThumbnail,
                  additionalImages: [additionalImage_1, additionalImage_2].filter(img => img), // Filter out undefined values
              },
              seo: {
                  metaTitle,
                  metaDescription,
                  metaImage,
                  indexing: {
                      index: true,
                      noIndex: false,
                      noFollow: false,
                      noArchive: false,
                      noSnippet: false,
                      noImageIndex: false,
                      maxSnippet: -1,
                      maxVideoPreview: -1,
                      maxImagePreview: -1,
                  },
              },
              seller: new mongoose.Types.ObjectId(seller), // Assuming seller is provided as an ID string
          };

          products.push(newProductData);
      }

      console.log('Products to be inserted:', products);

      // Insert products in bulk
      await Product.insertMany(products);

      // Delete the file after processing
      fs.unlinkSync(filePath);

      res.status(201).json({ message: 'Products imported successfully' });
  } catch (error) {
      console.error('Error during bulk import:', error); // Log the error for debugging
      res.status(500).json({ message: error.message });
  }
};


