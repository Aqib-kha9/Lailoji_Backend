import express from "express";
import {
  addProduct,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  approveProduct,
  getAllProducts,
} from "../controllers/product.js"; // Adjust the path as needed
import {upload} from "../middleware/fileUpload.js";
import sellerAuth from "../middleware/sellerAuth.js";
import handleImageUpload from "../middleware/productImage.js";

const router = express.Router();
// const uploadMultiple = upload.fields([
//   { name: 'thumbnail', maxCount: 1 },      // 'thumbnail' field (single image)
//   { name: 'metaImage', maxCount: 1 },      // 'metaImage' field (single image)
//   { name: 'additionalImages', maxCount: 10 } // 'additionalImages' field (up to 10 images)
// ]);

// Route to add a new product (Sellers, Product Managers, Admins, and SuperAdmins can add products)
router.post(
  "/add",
  // uploadMultiple,        // First handle file uploads using multer
  handleImageUpload,     // Then process images to get URLs from Cloudinary
  addProduct             // Finally, call the controller to add product details
);

// Route to get all products for a seller (Sellers and SuperAdmins can view their own products)
router.get(
  "/get",

  getSellerProducts
);

// Route to update product details (Sellers, Admins, and SuperAdmins can update products)
router.put(
  "/:productId",

  updateProduct
);

// Route to delete a product (Sellers, Admins, and SuperAdmins can delete products)
router.delete(
  "/:productId",

  deleteProduct
);

// Route for bulk import (Sellers, Admins, and SuperAdmins can bulk import products)
router.post(
  "/import",

  upload.single("file"),
  bulkImportProducts
);

// Route to approve a product (Only Admins and SuperAdmins can approve products)
router.put(
  "/:productId/approve",

  approveProduct
);

// Route to get all approved products (Accessible to all users)
router.get("/getApprovePro", getAllProducts);

export default router;
