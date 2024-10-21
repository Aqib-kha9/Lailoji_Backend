import express from 'express';
import { registerSeller,loginSeller } from '../controllers/seller.js';
import { check } from 'express-validator';

const router = express.Router();

router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('phoneNum', 'Phone number is required').not().isEmpty(),
    check('password', 'Password is required and should be 6 or more characters').isLength({ min: 6 }),
    check('aadhaar', 'Aadhaar number is required').not().isEmpty(),
    check('pan', 'PAN number is required').not().isEmpty(),
    // Add more checks as per your requirement
  ],
  registerSeller
);

router.post("/login",loginSeller);

export default router;
