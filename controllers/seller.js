import Seller from '../models/Seller.js';  // Adjust path based on your project structure
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator'; // Assuming you're using express-validator for input validation
import jwt from 'jsonwebtoken';

// Register Seller Controller
export const registerSeller = async (req, res) => {
  const { firstName, lastName, address, phoneNum, email, password, confirmPass, aadhaar, pan, image, otherDocuments, role } = req.body;

  // Validate input (ensure password matches confirmPass, etc.)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if passwords match
  if (password !== confirmPass) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Check if the seller already exists by phone number or email
    let sellerExists = await Seller.findOne({ $or: [{ email }, { phoneNum }] });
    if (sellerExists) {
      return res.status(400).json({ message: 'Seller with this email or phone number already exists' });
    }

    // Create a new seller object
    const newSeller = new Seller({
      firstName,
      lastName,
      address,
      phoneNum,
      email,
      password, // Password will be hashed in the 'pre-save' hook
      aadhaar,
      pan,
      image,
      otherDocuments,
      role: role || 'Seller' // Use provided role or default to 'Seller'
    });

    // Save the seller to the database
    await newSeller.save();

    // Return success response
    res.status(201).json({ message: 'Seller registered successfully', sellerId: newSeller._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error. Please try again later.' });
  }
};

// Seller Login Controller
export const loginSeller = async (req, res) => {
  const { email, phoneNum, password } = req.body;

  try {
    // Check if the seller exists by email or phone number
    let seller = await Seller.findOne({
      $or: [{ email: email }, { phoneNum: phoneNum }],
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Compare the entered password with the stored hashed password
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Create JWT token
    const payload = {
      sellerId: seller._id,
      email: seller.email,
      phoneNum: seller.phoneNum,
      role: seller.role // Include the role in the JWT payload
    };

    // Sign the token (set expiration as per your preference)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return the token to the client
    res.json({
      message: 'Login successful',
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error. Please try again later.' });
  }
};