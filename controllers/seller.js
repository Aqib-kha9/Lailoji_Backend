import Seller from '../models/Seller.js';  // Adjust path based on your project structure
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator'; // Assuming you're using express-validator for input validation
import jwt from 'jsonwebtoken';

import uploadToCloudinary from '../config/cloudinary.js'; // Ensure you have this configured correctly

export const registerSeller = async (req, res) => {
    const {
        fullName,
        shopName,
        address,
        phoneNum,
        email,
        password,
        confirmPass,
        role
    } = req.body;

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

        // // Check if Aadhaar or PAN images are unique
        // let documentExists = await Seller.findOne({ $or: [{ aadhaarImage: req.imageUrls.aadhaarImage }, { panImage: req.imageUrls.panImage }] });
        // if (documentExists) {
        //     return res.status(400).json({ message: 'Seller with this Aadhaar or PAN image already exists' });
        // }

        // Create a new seller object using image URLs from req.imageUrls
        const newSeller = new Seller({
            fullName,
            shopName,
            address,
            phoneNum,
            email,
            password, // Password will be hashed in the 'pre-save' hook
            aadhaarImage: req.imageUrls.aadhaarImage,
            panImage: req.imageUrls.panImage,
            sellerImage: req.imageUrls.sellerImage,
            shopLogo: req.imageUrls.shopLogo || '', // Handle optional field
            role: role || 'Seller' // Use provided role or default to 'Seller'
        });
        console.log(req.imageUrls.shopLogo);
        // Save the seller to the database
        await newSeller.save();

        // Return success response
        res.status(201).json({ message: 'Seller registered successfully', sellerId: newSeller._id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error. Please try again later.' });
    }
};


export const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.aggregate([
      {
        $lookup: {
          from: "products", // Collection name of Products
          localField: "_id", // Seller ID in the Seller model
          foreignField: "seller", // Field in Product that references Seller
          as: "products",
        },
      },
      {
        $lookup: {
          from: "orders", // Collection name of Orders
          localField: "_id", // Seller ID in the Seller model
          foreignField: "sellerId", // Field in Order that references Seller
          as: "orders",
        },
      },
      {
        $addFields: {
          totalProducts: { $size: "$products" }, // Calculate the number of products
          totalOrders: { $size: "$orders" }, // Calculate the number of orders
        },
      },
      {
        $project: {
          _id: 1,
          shopName: 1,
          fullName: 1, 
          phoneNum: 1,
          status: 1,
          shopLogo:1,
          address:1,
          email:1,
          totalProducts: 1,
          totalOrders: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch sellers",
      error: error.message,
    });
  }
};


// Update seller status
export const updateSellerStatus = async (req, res) => {
  const { sellerId } = req.params; // Get seller ID from request parameters
  const { status } = req.body; // Get the status from the request body

  try {
    // Find the seller by ID and update the status
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      { status: status }, // Assuming your seller model has an `isActive` field for status
      { new: true } // Return the updated document
    );

    if (!updatedSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Respond with the updated seller data
    return res.status(200).json({
      message: "Seller status updated successfully",
      data: updatedSeller,
    });
  } catch (error) {
    console.error('Error updating seller status:', error);
    return res.status(500).json({
      message: "An error occurred while updating seller status",
      error: error.message,
    });
  }
};


//Delete seller by id
export const deleteSellerById =  async (req, res) => {
  try {
    const sellerId = req.params.id;
    await Seller.findByIdAndDelete(sellerId);
    return res.status(200).json({ message: 'Seller deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error deleting seller' });
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