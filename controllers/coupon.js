
import Coupon from '../models/Coupon.js'; // Import your Coupon model
import Seller from '../models/Seller.js'; // Import your Seller model
import Category from '../models/Category.js'; // Import your Category model
import Product from '../models/Product.js'; // Import your Product model

// // Fetch sellers based on selection criteria
// export const fetchSellers = async (req, res) => {
//   try {
//     const sellers = await Seller.find(); // Fetch all sellers
//     res.status(200).json(sellers);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching sellers' });
//   }
// };

// // Fetch categories based on selected seller
// export const fetchCategories = async (req, res) => {
//   const { sellerId } = req.query;
//   try {
//     const categories = await Category.find({ seller: sellerId }); // Fetch categories linked to the seller
//     res.status(200).json(categories);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching categories' });
//   }
// };

// // Fetch products based on selected category and seller
// export const fetchProducts = async (req, res) => {
//   const { categoryId, sellerId } = req.query;
//   try {
//     const products = await Product.find({ category: categoryId, seller: sellerId });
//     res.status(200).json(products);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching products' });
//   }
// };


export const addCoupon = async (req, res) => {
  console.log(req.body);
  try {
    const {
      couponType,
      title,
      code,
      creatorType,
      creatorId,
      applicableProducts,
      applyToAllProducts,
      customer,
      specificCustomers,
      limitPerUser,
      discountType,
      discountAmount,
      minPurchase,
      startDate,
      expireDate,
      applyToAllCategories,
      categoryId,
    } = req.body;

    // Check if a coupon with the same code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    // Validation checks
    const validationErrors = [];

    if (!['discountOnPurchase', 'freeDelivery','firstOrder'].includes(couponType)) {
      validationErrors.push('Invalid couponType');
    }

    if (!title || title.trim().length < 3) {
      validationErrors.push('Title must be at least 3 characters long');
    }

    if (!['admin', 'seller'].includes(creatorType)) {
      validationErrors.push('Invalid creatorType');
    }

    if (!creatorId) {
      validationErrors.push('creatorId is required');
    }

    if (!applyToAllProducts && (!applicableProducts || applicableProducts.length === 0)) {
      validationErrors.push('Specify products or select applyToAllProducts');
    }

    if (!['all', 'specific'].includes(customer)) {
      validationErrors.push('Invalid customer value');
    }

    if (customer === 'specific' && (!specificCustomers || specificCustomers.length === 0)) {
      validationErrors.push('Specify customer IDs if selecting specific customers');
    }

    // if (limitPerUser < 1 || !Number.isInteger(limitPerUser)) {
    //   validationErrors.push('Limit must be an integer and at least 1');
    // }

    if (!['amount', 'percentage'].includes(discountType)) {
      validationErrors.push('Invalid discountType');
    }

    if (discountAmount < 1) {
      validationErrors.push('Discount must be at least 1');
    }

    if (minPurchase < 0) {
      validationErrors.push('Minimum purchase must be at least 0');
    }

    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime()) || startDateObj < new Date()) {
      validationErrors.push('Start date cannot be in the past');
    }

    const expireDateObj = new Date(expireDate);
    if (isNaN(expireDateObj.getTime()) || expireDateObj <= startDateObj) {
      validationErrors.push('Expiration date must be after the start date');
    }

    if (!applyToAllCategories && !categoryId) {
      validationErrors.push('Category is required when applyToAllCategories is false');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Validation errors', errors: validationErrors });
    }

    // Dynamically set products based on conditions
    let selectedProducts = [];
    if (applyToAllProducts) {
      selectedProducts = await Product.find({
        category: applyToAllCategories ? {} : categoryId,
        seller: creatorId,
      });
    } else {
      selectedProducts = applicableProducts;
    }

    // Create the new coupon
    const newCoupon = new Coupon({
      couponType,
      title,
      code,
      creatorType,
      creatorId,
      applicableProducts: selectedProducts,
      applyToAllProducts,
      customer,
      specificCustomers: customer === 'all' ? [] : specificCustomers,
      limitPerUser,
      discountType,
      discountAmount,
      minPurchase,
      startDate: startDateObj,
      expireDate: expireDateObj,
      applyToAllCategories,
      categoryId,
    });

    await newCoupon.save();
    res.status(201).json({
      message: 'Coupon added successfully',
      coupon: newCoupon,
      success: true,
    });
  } catch (error) {
    console.error('Error adding coupon:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message, success:false });
  }
};


export const getAllCoupons = async (req, res) => {
  try {
    // Optional query filters (e.g., ?creatorType=admin&applyToAllProducts=true)
    const { creatorType, applyToAllProducts, categoryId } = req.query;
    
    // Define the filter object to match specific conditions if provided
    const filter = {};

    if (creatorType) {
      filter.creatorType = creatorType;
    }

    if (applyToAllProducts !== undefined) {
      filter.applyToAllProducts = applyToAllProducts === 'true'; // Convert to boolean
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Fetch coupons based on the filter criteria
    const coupons = await Coupon.find(filter)
      .populate('applicableProducts', 'name') // Populate product names if needed
      .populate('specificCustomers', 'name email') // Populate customer details if needed
      .sort({createdAt:-1});

    res.status(200).json({
      message: 'Coupons fetched successfully',
      coupons,
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// In your backend controller (e.g., couponController.js)
export const updateCouponStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon status updated', coupon: updatedCoupon });
  } catch (error) {
    console.error('Error updating coupon status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Controller function to edit a selected coupon
export const editCoupon = async (req, res) => {
  const couponId = req.params.id; // Get coupon ID from request parameters
  const updates = req.body; // Get the updates from the request body
  console.log(couponId);
  try {
    // Find the existing coupon by ID
    const existingCoupon = await Coupon.findById(couponId);
    if (!existingCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Update only fields that are provided, retaining existing values for others
    const updateFields = [
      'couponType',
      'title',
      'code',
      'creatorType',
      'creatorId',
      'applicableProducts',
      'applyToAllProducts',
      'customer',
      'specificCustomers',
      'limitPerUser',
      'discountType',
      'discountAmount',
      'minPurchase',
      'startDate',
      'expireDate',
      'applyToAllCategories',
      'categoryId',
      'status'
    ];

    // Build updatedCouponData dynamically
    const updatedCouponData = {};
    updateFields.forEach(field => {
      if (updates[field] !== undefined) {
        updatedCouponData[field] = updates[field];
      } else {
        updatedCouponData[field] = existingCoupon[field];
      }
    });

    // Update the coupon in the database
    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updatedCouponData, {
      new: true,
      runValidators: true, // Ensure validation on updated fields
      context: 'query' // Needed for validators using `this` context
    });

    // Respond with the updated coupon
    res.status(200).json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
  } catch (error) {
    console.error(error);
    // Detailed error handling for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Controller function to delete a coupon
export const deleteCoupon = async (req, res) => {
  const couponId  = req.params.couponId; // Get the coupon ID from request parameters
  console.log(req.params);
  console.log(couponId);
  try {
    // Find and delete the coupon by ID
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    
    // Check if the coupon was found and deleted
    if (!deletedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Respond with a success message
    res.status(200).json({ message: 'Coupon deleted successfully', coupon: deletedCoupon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
  
};