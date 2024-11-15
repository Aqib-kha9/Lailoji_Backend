import express from "express";
import {
  addProduct,
  getAllProducts,
  toggleFeaturedStatus,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  exportData,
  getProductById,
  getProductsBySellerAndCategory,
  toggleProductStatus
} from "../controllers/product.js"; // Adjust the path as needed
import sellerAuth from "../middleware/sellerAuth.js";
import handleImageUpload from "../middleware/productImage.js";
import multer from 'multer';


const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, './uploads'); // Folder where files will be uploaded
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Create unique filenames
  }
});
const upload = multer({ storage });

// Route to add a new product (Sellers, Product Managers, Admins, and SuperAdmins can add products)
router.post(
  "/add",
  // uploadMultiple,        // First handle file uploads using multer
  handleImageUpload, // Then process images to get URLs from Cloudinary
  addProduct // Finally, call the controller to add product details
);

router.put("/:id/status",toggleProductStatus)

// Route to get products by seller and category
router.get("/category", getProductsBySellerAndCategory);

// Route to get all products for a seller (Sellers and SuperAdmins can view their own products)
router.get("/", getAllProducts);

router.put("/:id/feature", toggleFeaturedStatus);

// Download data as csv or excel

router.post("/export", exportData);

router.get("/:id",getProductById)
// Route to update product details (Sellers, Admins, and SuperAdmins can update products)
router.put("/:productId", updateProduct);



// Route to delete a product (Sellers, Admins, and SuperAdmins can delete products)
router.delete(
  "/:productId",
  deleteProduct
);





// Bulk import categories route
router.post('/import', upload.single('product-file'), bulkImportProducts);



// // Route for bulk import (Sellers, Admins, and SuperAdmins can bulk import products)
// router.post(
//   "/import",

//   upload.single("file"),
//   bulkImportProducts
// );

// // Route to approve a product (Only Admins and SuperAdmins can approve products)
// router.put(
//   "/:productId/approve",

//   approveProduct
// );

// Route to get all approved products (Accessible to all users)
// router.get("/getApprovePro", getAllProducts);

export default router;
