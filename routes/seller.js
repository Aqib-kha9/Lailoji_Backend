import express from 'express';
import { registerSeller,getAllSellers,updateSellerStatus,deleteSellerById,loginSeller } from '../controllers/seller.js';
import handleSellerImageUpload from '../middleware/sellerRegisterImage.js'; // Adjust the path as needed

import { check } from 'express-validator';
import multer from 'multer';

const router = express.Router();



// Route for seller registration
router.post('/register', handleSellerImageUpload, registerSeller);


// Get all sellers 
router.get('/',getAllSellers);

// Route to update seller status
router.put('/:sellerId/status', updateSellerStatus);

// Delete Seller By Id
router.delete('/:id',deleteSellerById);

router.post("/login",loginSeller);

export default router;
