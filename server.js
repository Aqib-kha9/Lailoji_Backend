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
import customerRoutes from './routes/customer.js';
import orderRoutes from './routes/order.js';
import customerAddressRoutes from './routes/customerAddress.js';
import reviewRoutes from './routes/customeReview.js';
import bannerRoutes from './routes/banner.js'
import couponRoutes from './routes/coupon.js';
import flashDealRoutes from './routes/flashDeal.js';
import dealOfTheDayRoutes from './routes/dealOfTheDay.js';
import withdrawalMethodRoutes from './routes/withdrawalMeth.js';
import notificationRoutes from './routes/notification.js';
import deviceTokenRoutes from './routes/deviceToken.js';
import refundReqRoutes from './routes/refundReq.js';
import smsTemplateRoutes from './routes/smsTemplate.js'
dotenv.config();

connectDB();




const app = express();
app.use(express.json());

// // Allow specific origins
// const allowedOrigins = [
//   'http://localhost:3000',
//   'https://lailojiadminp.onrender.com',
//   'http://localhost:5000' // Add localhost:5000 to allowed origins
// ];
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (allowedOrigins.includes(origin) || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
// };

// app.use(cors(corsOptions));

const corsOptions = {
  origin: '*', // Allow all origins
};

app.use(cors(corsOptions));





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

// Customer Routes

app.use("/api/customers",customerRoutes);


// Register Order Routes
app.use('/api/orders', orderRoutes);


// CustomerAddress routes
app.use('/api/customer-addresses', customerAddressRoutes);

// Use the review routes
app.use('/api/reviews', reviewRoutes);


// Banner Routes
app.use('/api/banners',bannerRoutes);


// Coupon Routes 
app.use('/api/coupons',couponRoutes);

// Flash Deals Route

app.use('/api/flash-deals',flashDealRoutes);

// Deal of the Day
app.use('/api/deal-days',dealOfTheDayRoutes);

// add seller withdrawal methode
app.use('/api/withdrawal-methods',withdrawalMethodRoutes);

// Send Notification 
app.use('/api/notifications', notificationRoutes);

// Device Token
app.use('/api/device-tokens',deviceTokenRoutes);

// Refund Req
app.use('/api/refund-req',refundReqRoutes);

// Sms Template 
app.use('/api/sms-template',smsTemplateRoutes);



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
