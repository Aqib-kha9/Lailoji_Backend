import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/user.js';
import sellerRoutes from './routes/seller.js';
import productRoutes from './routes/product.js';
import categoryRoutes from './routes/category.js';
import subCategoryRoutes from './routes/subCategory.js';
import subSubCategoryRoutes from './routes/subSubCategory.js';
import importCategoryRoutes from './routes/bulkImportCategory.js';
import brandRoutes from './routes/brand.js';
dotenv.config();

connectDB();




const app = express();
app.use(express.json());
app.use(cors({
    origin: '*', // allow all origins (for testing purposes)
}));



// Serve static files from the uploads directory
app.use('/uploads', express.static(path.resolve('uploads'))); // Using path.resolve
// Get the directory name equivalent to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.get("/",(req,res)=>{
    res.send("Hi i am your home route");
})

// User Routes

app.use('/api/users', userRoutes);

// Seller Routes

app.use("/api/sellers", sellerRoutes);

// Product Routes

app.use("/api/products",productRoutes);

// Category Routes

app.use("/api/categories",categoryRoutes);

// Sub Category Routes
app.use('/api/subcategories', subCategoryRoutes);

// SubSubCategory routes
app.use('/api/subsubcategories', subSubCategoryRoutes);

// Bulk Import category
app.use("/api/categories",importCategoryRoutes);

// Brand Routes
app.use('/api/brands',brandRoutes);





const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
