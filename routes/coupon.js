import express from 'express';
import { addCoupon,editCoupon,getAllCoupons,updateCouponStatus,deleteCoupon } from '../controllers/coupon.js'; // Adjust the path as necessary

const router = express.Router();

// Route to add a coupon
router.post('/', addCoupon);
// Route to delete a coupon
router.delete('/:couponId', deleteCoupon); // Delete coupon by ID
// Route to get All coupn
router.get('/',getAllCoupons);

// Route to update coupon status
router.patch('/:id/status',updateCouponStatus);

// Route to update a specific coupon 
router.patch('/:id',editCoupon);



export default router;
