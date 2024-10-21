import Product from '../models/Product.js'; // Adjust the path as needed
import Seller from '../models/Seller.js';
import fs from 'fs';
import xlsx from 'xlsx';

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







// Controller to get all products for a seller
export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.seller._id;

    // Find all products that belong to the authenticated seller
    const products = await Product.find({ seller: sellerId });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for this seller.' });
    }

    return res.status(200).json({ message: 'Products retrieved successfully', products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving products', error: error.message });
  }
};

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

// Controller to delete a product by productId
export const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  const seller = req.seller;

  try {
    // Find the product by productId and seller
    const product = await Product.findOne({ _id: productId, seller: seller._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or you do not have permission to delete this product' });
    }

    await Product.deleteOne({ _id: productId });

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Controller to bulk import products from Excel file
export const bulkImportProducts = async (req, res) => {
  const seller = req.seller;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const savedProducts = [];
    const failedProducts = [];

    // Loop through each row in the sheetData
    for (const row of sheetData) {
      try {
        const newProduct = new Product({
          productName: row.productName,
          generalInfo: {
            category: row.category,
            subCategory: row.subCategory,
            subSubCategory: row.subSubCategory,
            brand: row.brand,
            productType: row.productType,
            unit: row.unit,
            productSKU: row.productSKU,
          },
          pricing: {
            unitPrice: row.unitPrice,
            minimumOrderQty: row.minimumOrderQty,
            currentStockQty: row.currentStockQty,
            discountType: row.discountType,
            discountAmount: row.discountAmount,
            taxAmount: row.taxAmount,
            taxCalculation: row.taxCalculation,
            shippingCost: row.shippingCost,
          },
          seo: {
            metaTitle: row.metaTitle,
            metaDescription: row.metaDescription,
            metaImage: row.metaImage,
            indexing: {
              index: row.index === "true",
              noIndex: row.noIndex === "true",
              noFollow: row.noFollow === "true",
              noArchive: row.noArchive === "true",
              noSnippet: row.noSnippet === "true",
              noImageIndex: row.noImageIndex === "true",
              maxSnippet: parseInt(row.maxSnippet) || -1,
              maxVideoPreview: parseInt(row.maxVideoPreview) || -1,
              maxImagePreview: parseInt(row.maxImagePreview) || -1,
            },
          },
          seller: seller._id,
        });

        const savedProduct = await newProduct.save();
        savedProducts.push(savedProduct);
      } catch (error) {
        failedProducts.push({ row, error: error.message });
      }
    }

    fs.unlinkSync(filePath);

    res.status(201).json({
      message: 'Bulk import completed',
      savedProducts,
      failedProducts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing file', error: error.message });
  }
};

// Controller to approve a product
export const approveProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.settings.productStatus = 'Approved';
    await product.save();

    res.status(200).json({ message: 'Product approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error. Please try again later.' });
  }
};

// Get all approved products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ "settings.productStatus": 'Approved' });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error. Please try again later.' });
  }
};
