import Order from '../models/Order.js'; // Import the Order model and order ID generator
import Customer from '../models/Customer.js'; // Import Customer model
import Seller from '../models/Seller.js'; // Import Seller model
import Product from '../models/Product.js';
import ExcelJS from 'exceljs'
import { parse } from 'json2csv';


// Function to generate unique orderId
const generateOrderId = async () => {
    const timestamp = Date.now(); // Get the current timestamp
    const randomNumber = Math.floor(Math.random() * 10000); // Generate a random number
    return `ORD-${timestamp}-${randomNumber}`; // Format the orderId
};

const updateProductSales = async (productId, quantitySold, unitPrice) => {
  try {
    const product = await Product.findById(productId);
    
    // Update the total sold quantity
    product.totalSold += quantitySold;
    
    // Update the total sold amount
    product.totalSoldAmount += quantitySold * unitPrice;

    // Save the updated product
    await product.save();
    
    console.log('Product sales updated successfully');
  } catch (error) {
    console.error('Error updating product sales:', error);
  }
};

// Create New Order
export const createNewOrder = async (req, res) => {
  try {
    const { customerId, sellerId, addressId, paymentMethod, orderItems } = req.body;

    // Validate required fields
    if (!customerId || !sellerId || !addressId || !paymentMethod || orderItems.length === 0) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Generate a unique orderId
    const orderId = await generateOrderId();

    // Calculate total price of the order
    const total = orderItems.reduce((acc, item) => acc + item.totalPrice, 0);

    // Verify if customer and seller exist
    const customer = await Customer.findById(customerId);
    const seller = await Seller.findById(sellerId);
    if (!customer || !seller) {
      return res.status(404).json({ message: 'Customer or Seller not found.' });
    }

    // Create the new order
    const newOrder = new Order({
      orderId,
      total,
      customer: customerId,
      seller: sellerId,
      customerAddress: addressId,
      paymentMethod,
      verificationCode: Math.random().toString(36).substring(7), // Generate a random verification code
      orderItems
    });

    // Save the order in the database
    await newOrder.save();

    // For each product in the order, update the product sales
    for (const item of orderItems) {
      await updateProductSales(item.productId, item.quantity, item.unitPrice);
    }

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};


// Get Orders by Customer ID
export const getOrdersByCustomerId = async (req, res) => {
  try {
    const { id } = req.params; // Extract the customer ID from the request parameters
    console.log(id);
    // Fetch orders where the customer matches the provided ID
    const orders = await Order.find({ customer: id }) // Fetch orders by customerId
    //   .populate('customer', 'name contactInfo') // Populating customer data (if required)
    //   .populate('orderItems.productId', 'name price') // Populating product information for each order item
    //   .populate('customerAddress', 'street city country'); // Populating customer address

    console.log(orders);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this customer ID' });
    }

    // Calculate total number of orders by customer
    const totalOrdersByCustomer = await Order.countDocuments({ customer: id });

    // Response with orders and total order count for the customer
    res.status(200).json({
     totalOrdersByCustomer,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const getAllStores = async (req, res) => {
  try {
    // Fetch unique shop names
    const stores = await Seller.distinct("shopName");

    // Respond with the store names
    res.status(200).json({
      success: true,
      stores,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching stores.",
      error: error.message,
    });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { orderStatus, store, customer, dateType } = req.query;

    // Initial match conditions
    const matchConditions = {};

    if (orderStatus) {
      matchConditions.status = orderStatus;
    }

    if (store) {
      matchConditions["sellerDetails.shopName"] = { $regex: new RegExp(store, "i") };
    }

    if (customer) {
      const cleanedCustomer = customer.trim();
      matchConditions.$or = [
        { "customerDetails.firstName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.lastName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.phoneNumber": { $regex: `^${cleanedCustomer}$`, $options: "i" } }
      ];
    }

    if (dateType) {
      const today = new Date();
      if (dateType === "thisWeek") {
        matchConditions.createdAt = { $gte: new Date(today.setDate(today.getDate() - today.getDay())) };
      } else if (dateType === "thisMonth") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), today.getMonth(), 1) };
      } else if (dateType === "thisYear") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), 0, 1) };
      }
    }

    const aggregatePipeline = [
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      { $unwind: "$customerDetails" },

      {
        $lookup: {
          from: "customeraddresses",
          localField: "customerAddress",
          foreignField: "_id",
          as: "customerAddressDetails",
        },
      },
      { $unwind: { path: "$customerAddressDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sellers",
          localField: "seller",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      { $unwind: "$sellerDetails" },

      // Lookup product details and map them to orderItems
      {
        $lookup: {
          from: "products",
          localField: "orderItems.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      // Match the conditions after joining
      { $match: matchConditions },

      // Map productDetails to each orderItem
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                unitPrice: "$$item.unitPrice",
                tax: "$$item.tax",
                itemDiscount: "$$item.itemDiscount",
                totalPrice: "$$item.totalPrice",
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Final projection
      {
        $project: {
          orderId: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          customerDetails: {
            firstName: "$customerDetails.firstName",
            lastName: "$customerDetails.lastName",
            phoneNumber: "$customerDetails.phoneNumber",
            email: "$customerDetails.email",
          },
          sellerDetails: {
            shopName: "$sellerDetails.shopName",
            phoneNum: "$sellerDetails.phoneNum",
            email: "$sellerDetails.email",
            address: "$sellerDetails.address",
            shopLogo: "$sellerDetails.shopLogo"
          },
          billingAddressDetails: {
            contactPersonName: "$customerAddressDetails.billingAddress.contactPersonName",
            phone: "$customerAddressDetails.billingAddress.phone",
            addressType: "$customerAddressDetails.billingAddress.addressType",
            address: "$customerAddressDetails.billingAddress.address",
            city: "$customerAddressDetails.billingAddress.city",
            zipCode: "$customerAddressDetails.billingAddress.zipCode",
            country: "$customerAddressDetails.billingAddress.country",
            note: "$customerAddressDetails.billingAddress.note",
          },
          shippingAddressDetails: {
            contactPersonName: "$customerAddressDetails.shippingAddress.contactPersonName",
            phone: "$customerAddressDetails.shippingAddress.phone",
            addressType: "$customerAddressDetails.shippingAddress.addressType",
            address: "$customerAddressDetails.shippingAddress.address",
            city: "$customerAddressDetails.shippingAddress.city",
            zipCode: "$customerAddressDetails.shippingAddress.zipCode",
            country: "$customerAddressDetails.shippingAddress.country",
            note: "$customerAddressDetails.shippingAddress.note",
          },
          orderItems: 1,
        },
      },

      // Sorting, Pagination
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count total orders matching the conditions
    const totalOrders = await Order.countDocuments(matchConditions);

    // Execute the aggregation pipeline
    const allOrders = await Order.aggregate(aggregatePipeline);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      data: allOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching orders.",
      error: error.message,
    });
  }
};

export const getAllPendingOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Page number, defaults to 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, defaults to 10
    const skip = (page - 1) * limit; // Skipping records for pagination

    const { orderStatus, store, customer, dateType, searchQuery } = req.query;

    console.log(req.query); // Log the query params for debugging

    // Default match condition: only 'Pending' orders
    const matchConditions = { status: "Pending" };

    // Filter by specific order status if provided
    if (orderStatus) {
      matchConditions.status = orderStatus;
    }

    // Filter by store/shop name if provided
    if (store) {
      matchConditions["sellerDetails.shopName"] = { $regex: new RegExp(store, "i") };
    }

    // Filter by customer details (first name, last name, or phone number)
    if (customer) {
      const cleanedCustomer = customer.trim(); // Clean up customer input
      matchConditions.$or = [
        { "customerDetails.firstName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.lastName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.phoneNumber": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
      ];
    }

    // Filter by date range based on `dateType` (thisWeek, thisMonth, thisYear)
    if (dateType) {
      const today = new Date();
      if (dateType === "thisWeek") {
        matchConditions.createdAt = { $gte: new Date(today.setDate(today.getDate() - today.getDay())) };
      } else if (dateType === "thisMonth") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), today.getMonth(), 1) };
      } else if (dateType === "thisYear") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), 0, 1) };
      }
    }

    // Add search filter if provided (search across orderId, customer email, or seller shop name)
    if (searchQuery) {
      matchConditions.$or = matchConditions.$or || [];
      matchConditions.$or.push(
        { orderId: { $regex: searchQuery, $options: "i" } },
        { "customerDetails.email": { $regex: searchQuery, $options: "i" } },
        { "sellerDetails.shopName": { $regex: searchQuery, $options: "i" } }
      );
    }

    // Aggregation pipeline to fetch orders with related data
    const aggregatePipeline = [
      {
        $lookup: {
          from: "customers", // Join with the "customers" collection
          localField: "customer", // Field in orders collection
          foreignField: "_id", // Field in customers collection
          as: "customerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$customerDetails" },

      {
        $lookup: {
          from: "customeraddresses", // Join with the "customeraddresses" collection
          localField: "customerAddress", // Field in orders collection
          foreignField: "_id", // Field in customeraddresses collection
          as: "customerAddressDetails", // Alias for the joined data
        },
      },
      { $unwind: { path: "$customerAddressDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sellers", // Join with the "sellers" collection
          localField: "seller", // Field in orders collection
          foreignField: "_id", // Field in sellers collection
          as: "sellerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$sellerDetails" },

      {
        $lookup: {
          from: "products", // Join with the "products" collection
          localField: "orderItems.productId", // Field in orderItems
          foreignField: "_id", // Field in products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Match the filter conditions after performing the joins
      { $match: matchConditions },

      // Map product details into orderItems
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                unitPrice: "$$item.unitPrice",
                tax: "$$item.tax",
                itemDiscount: "$$item.itemDiscount",
                totalPrice: "$$item.totalPrice",
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Final projection to select the desired fields
      {
        $project: {
          orderId: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          customerDetails: {
            firstName: "$customerDetails.firstName",
            lastName: "$customerDetails.lastName",
            phoneNumber: "$customerDetails.phoneNumber",
            email: "$customerDetails.email",
          },
          sellerDetails: {
            shopName: "$sellerDetails.shopName",
            phoneNum: "$sellerDetails.phoneNum",
            email: "$sellerDetails.email",
            address: "$sellerDetails.address",
            shopLogo: "$sellerDetails.shopLogo",
          },
          billingAddressDetails: {
            contactPersonName: "$customerAddressDetails.billingAddress.contactPersonName",
            phone: "$customerAddressDetails.billingAddress.phone",
            addressType: "$customerAddressDetails.billingAddress.addressType",
            address: "$customerAddressDetails.billingAddress.address",
            city: "$customerAddressDetails.billingAddress.city",
            zipCode: "$customerAddressDetails.billingAddress.zipCode",
            country: "$customerAddressDetails.billingAddress.country",
            note: "$customerAddressDetails.billingAddress.note",
          },
          shippingAddressDetails: {
            contactPersonName: "$customerAddressDetails.shippingAddress.contactPersonName",
            phone: "$customerAddressDetails.shippingAddress.phone",
            addressType: "$customerAddressDetails.shippingAddress.addressType",
            address: "$customerAddressDetails.shippingAddress.address",
            city: "$customerAddressDetails.shippingAddress.city",
            zipCode: "$customerAddressDetails.shippingAddress.zipCode",
            country: "$customerAddressDetails.shippingAddress.country",
            note: "$customerAddressDetails.shippingAddress.note",
          },
          orderItems: 1,
        },
      },

      // Sorting, Pagination
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count the total number of orders matching the conditions for pagination
    const totalOrders = await Order.countDocuments(matchConditions);

    // Execute the aggregation pipeline to fetch the orders
    const allOrders = await Order.aggregate(aggregatePipeline);

    // Return the response with pagination data
    return res.status(200).json({
      success: true,
      message: "Pending orders fetched successfully.",
      data: allOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending orders.",
      error: error.message,
    });
  }
};

// get all confirm orders
export const getAllConfirmOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Page number, defaults to 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, defaults to 10
    const skip = (page - 1) * limit; // Skipping records for pagination

    const { orderStatus, store, customer, dateType, searchQuery } = req.query;

    console.log(req.query); // Log the query params for debugging

    // Default match condition: only 'Pending' orders
    const matchConditions = { status: "Confirmed" };

    // Filter by specific order status if provided
    if (orderStatus) {
      matchConditions.status = orderStatus;
    }

    // Filter by store/shop name if provided
    if (store) {
      matchConditions["sellerDetails.shopName"] = { $regex: new RegExp(store, "i") };
    }

    // Filter by customer details (first name, last name, or phone number)
    if (customer) {
      const cleanedCustomer = customer.trim(); // Clean up customer input
      matchConditions.$or = [
        { "customerDetails.firstName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.lastName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.phoneNumber": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
      ];
    }

    // Filter by date range based on `dateType` (thisWeek, thisMonth, thisYear)
    if (dateType) {
      const today = new Date();
      if (dateType === "thisWeek") {
        matchConditions.createdAt = { $gte: new Date(today.setDate(today.getDate() - today.getDay())) };
      } else if (dateType === "thisMonth") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), today.getMonth(), 1) };
      } else if (dateType === "thisYear") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), 0, 1) };
      }
    }

    // Add search filter if provided (search across orderId, customer email, or seller shop name)
    if (searchQuery) {
      matchConditions.$or = matchConditions.$or || [];
      matchConditions.$or.push(
        { orderId: { $regex: searchQuery, $options: "i" } },
        { "customerDetails.email": { $regex: searchQuery, $options: "i" } },
        { "sellerDetails.shopName": { $regex: searchQuery, $options: "i" } }
      );
    }

    // Aggregation pipeline to fetch orders with related data
    const aggregatePipeline = [
      {
        $lookup: {
          from: "customers", // Join with the "customers" collection
          localField: "customer", // Field in orders collection
          foreignField: "_id", // Field in customers collection
          as: "customerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$customerDetails" },

      {
        $lookup: {
          from: "customeraddresses", // Join with the "customeraddresses" collection
          localField: "customerAddress", // Field in orders collection
          foreignField: "_id", // Field in customeraddresses collection
          as: "customerAddressDetails", // Alias for the joined data
        },
      },
      { $unwind: { path: "$customerAddressDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sellers", // Join with the "sellers" collection
          localField: "seller", // Field in orders collection
          foreignField: "_id", // Field in sellers collection
          as: "sellerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$sellerDetails" },

      {
        $lookup: {
          from: "products", // Join with the "products" collection
          localField: "orderItems.productId", // Field in orderItems
          foreignField: "_id", // Field in products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Match the filter conditions after performing the joins
      { $match: matchConditions },

      // Map product details into orderItems
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                unitPrice: "$$item.unitPrice",
                tax: "$$item.tax",
                itemDiscount: "$$item.itemDiscount",
                totalPrice: "$$item.totalPrice",
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Final projection to select the desired fields
      {
        $project: {
          orderId: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          customerDetails: {
            firstName: "$customerDetails.firstName",
            lastName: "$customerDetails.lastName",
            phoneNumber: "$customerDetails.phoneNumber",
            email: "$customerDetails.email",
          },
          sellerDetails: {
            shopName: "$sellerDetails.shopName",
            phoneNum: "$sellerDetails.phoneNum",
            email: "$sellerDetails.email",
            address: "$sellerDetails.address",
            shopLogo: "$sellerDetails.shopLogo",
          },
          billingAddressDetails: {
            contactPersonName: "$customerAddressDetails.billingAddress.contactPersonName",
            phone: "$customerAddressDetails.billingAddress.phone",
            addressType: "$customerAddressDetails.billingAddress.addressType",
            address: "$customerAddressDetails.billingAddress.address",
            city: "$customerAddressDetails.billingAddress.city",
            zipCode: "$customerAddressDetails.billingAddress.zipCode",
            country: "$customerAddressDetails.billingAddress.country",
            note: "$customerAddressDetails.billingAddress.note",
          },
          shippingAddressDetails: {
            contactPersonName: "$customerAddressDetails.shippingAddress.contactPersonName",
            phone: "$customerAddressDetails.shippingAddress.phone",
            addressType: "$customerAddressDetails.shippingAddress.addressType",
            address: "$customerAddressDetails.shippingAddress.address",
            city: "$customerAddressDetails.shippingAddress.city",
            zipCode: "$customerAddressDetails.shippingAddress.zipCode",
            country: "$customerAddressDetails.shippingAddress.country",
            note: "$customerAddressDetails.shippingAddress.note",
          },
          orderItems: 1,
        },
      },

      // Sorting, Pagination
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count the total number of orders matching the conditions for pagination
    const totalOrders = await Order.countDocuments(matchConditions);

    // Execute the aggregation pipeline to fetch the orders
    const allOrders = await Order.aggregate(aggregatePipeline);

    // Return the response with pagination data
    return res.status(200).json({
      success: true,
      message: "Confirmed orders fetched successfully.",
      data: allOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending orders.",
      error: error.message,
    });
  }
};

// get all packaging orders
export const getAllPackagingOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Page number, defaults to 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, defaults to 10
    const skip = (page - 1) * limit; // Skipping records for pagination

    const { orderStatus, store, customer, dateType, searchQuery } = req.query;

    console.log(req.query); // Log the query params for debugging

    // Default match condition: only 'Pending' orders
    const matchConditions = { status: "Packaging" };

    // Filter by specific order status if provided
    if (orderStatus) {
      matchConditions.status = orderStatus;
    }

    // Filter by store/shop name if provided
    if (store) {
      matchConditions["sellerDetails.shopName"] = { $regex: new RegExp(store, "i") };
    }

    // Filter by customer details (first name, last name, or phone number)
    if (customer) {
      const cleanedCustomer = customer.trim(); // Clean up customer input
      matchConditions.$or = [
        { "customerDetails.firstName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.lastName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.phoneNumber": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
      ];
    }

    // Filter by date range based on `dateType` (thisWeek, thisMonth, thisYear)
    if (dateType) {
      const today = new Date();
      if (dateType === "thisWeek") {
        matchConditions.createdAt = { $gte: new Date(today.setDate(today.getDate() - today.getDay())) };
      } else if (dateType === "thisMonth") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), today.getMonth(), 1) };
      } else if (dateType === "thisYear") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), 0, 1) };
      }
    }

    // Add search filter if provided (search across orderId, customer email, or seller shop name)
    if (searchQuery) {
      matchConditions.$or = matchConditions.$or || [];
      matchConditions.$or.push(
        { orderId: { $regex: searchQuery, $options: "i" } },
        { "customerDetails.email": { $regex: searchQuery, $options: "i" } },
        { "sellerDetails.shopName": { $regex: searchQuery, $options: "i" } }
      );
    }

    // Aggregation pipeline to fetch orders with related data
    const aggregatePipeline = [
      {
        $lookup: {
          from: "customers", // Join with the "customers" collection
          localField: "customer", // Field in orders collection
          foreignField: "_id", // Field in customers collection
          as: "customerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$customerDetails" },

      {
        $lookup: {
          from: "customeraddresses", // Join with the "customeraddresses" collection
          localField: "customerAddress", // Field in orders collection
          foreignField: "_id", // Field in customeraddresses collection
          as: "customerAddressDetails", // Alias for the joined data
        },
      },
      { $unwind: { path: "$customerAddressDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sellers", // Join with the "sellers" collection
          localField: "seller", // Field in orders collection
          foreignField: "_id", // Field in sellers collection
          as: "sellerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$sellerDetails" },

      {
        $lookup: {
          from: "products", // Join with the "products" collection
          localField: "orderItems.productId", // Field in orderItems
          foreignField: "_id", // Field in products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Match the filter conditions after performing the joins
      { $match: matchConditions },

      // Map product details into orderItems
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                unitPrice: "$$item.unitPrice",
                tax: "$$item.tax",
                itemDiscount: "$$item.itemDiscount",
                totalPrice: "$$item.totalPrice",
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Final projection to select the desired fields
      {
        $project: {
          orderId: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          customerDetails: {
            firstName: "$customerDetails.firstName",
            lastName: "$customerDetails.lastName",
            phoneNumber: "$customerDetails.phoneNumber",
            email: "$customerDetails.email",
          },
          sellerDetails: {
            shopName: "$sellerDetails.shopName",
            phoneNum: "$sellerDetails.phoneNum",
            email: "$sellerDetails.email",
            address: "$sellerDetails.address",
            shopLogo: "$sellerDetails.shopLogo",
          },
          billingAddressDetails: {
            contactPersonName: "$customerAddressDetails.billingAddress.contactPersonName",
            phone: "$customerAddressDetails.billingAddress.phone",
            addressType: "$customerAddressDetails.billingAddress.addressType",
            address: "$customerAddressDetails.billingAddress.address",
            city: "$customerAddressDetails.billingAddress.city",
            zipCode: "$customerAddressDetails.billingAddress.zipCode",
            country: "$customerAddressDetails.billingAddress.country",
            note: "$customerAddressDetails.billingAddress.note",
          },
          shippingAddressDetails: {
            contactPersonName: "$customerAddressDetails.shippingAddress.contactPersonName",
            phone: "$customerAddressDetails.shippingAddress.phone",
            addressType: "$customerAddressDetails.shippingAddress.addressType",
            address: "$customerAddressDetails.shippingAddress.address",
            city: "$customerAddressDetails.shippingAddress.city",
            zipCode: "$customerAddressDetails.shippingAddress.zipCode",
            country: "$customerAddressDetails.shippingAddress.country",
            note: "$customerAddressDetails.shippingAddress.note",
          },
          orderItems: 1,
        },
      },

      // Sorting, Pagination
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count the total number of orders matching the conditions for pagination
    const totalOrders = await Order.countDocuments(matchConditions);

    // Execute the aggregation pipeline to fetch the orders
    const allOrders = await Order.aggregate(aggregatePipeline);

    // Return the response with pagination data
    return res.status(200).json({
      success: true,
      message: "Packaging orders fetched successfully.",
      data: allOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending orders.",
      error: error.message,
    });
  }
};

// get all packaging orders
export const getAllCanceledOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Page number, defaults to 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, defaults to 10
    const skip = (page - 1) * limit; // Skipping records for pagination

    const { orderStatus, store, customer, dateType, searchQuery } = req.query;

    console.log(req.query); // Log the query params for debugging

    // Default match condition: only 'Pending' orders
    const matchConditions = { status: "Canceled" };

    // Filter by specific order status if provided
    if (orderStatus) {
      matchConditions.status = orderStatus;
    }

    // Filter by store/shop name if provided
    if (store) {
      matchConditions["sellerDetails.shopName"] = { $regex: new RegExp(store, "i") };
    }

    // Filter by customer details (first name, last name, or phone number)
    if (customer) {
      const cleanedCustomer = customer.trim(); // Clean up customer input
      matchConditions.$or = [
        { "customerDetails.firstName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.lastName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.phoneNumber": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
      ];
    }

    // Filter by date range based on `dateType` (thisWeek, thisMonth, thisYear)
    if (dateType) {
      const today = new Date();
      if (dateType === "thisWeek") {
        matchConditions.createdAt = { $gte: new Date(today.setDate(today.getDate() - today.getDay())) };
      } else if (dateType === "thisMonth") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), today.getMonth(), 1) };
      } else if (dateType === "thisYear") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), 0, 1) };
      }
    }

    // Add search filter if provided (search across orderId, customer email, or seller shop name)
    if (searchQuery) {
      matchConditions.$or = matchConditions.$or || [];
      matchConditions.$or.push(
        { orderId: { $regex: searchQuery, $options: "i" } },
        { "customerDetails.email": { $regex: searchQuery, $options: "i" } },
        { "sellerDetails.shopName": { $regex: searchQuery, $options: "i" } }
      );
    }

    // Aggregation pipeline to fetch orders with related data
    const aggregatePipeline = [
      {
        $lookup: {
          from: "customers", // Join with the "customers" collection
          localField: "customer", // Field in orders collection
          foreignField: "_id", // Field in customers collection
          as: "customerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$customerDetails" },

      {
        $lookup: {
          from: "customeraddresses", // Join with the "customeraddresses" collection
          localField: "customerAddress", // Field in orders collection
          foreignField: "_id", // Field in customeraddresses collection
          as: "customerAddressDetails", // Alias for the joined data
        },
      },
      { $unwind: { path: "$customerAddressDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sellers", // Join with the "sellers" collection
          localField: "seller", // Field in orders collection
          foreignField: "_id", // Field in sellers collection
          as: "sellerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$sellerDetails" },

      {
        $lookup: {
          from: "products", // Join with the "products" collection
          localField: "orderItems.productId", // Field in orderItems
          foreignField: "_id", // Field in products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Match the filter conditions after performing the joins
      { $match: matchConditions },

      // Map product details into orderItems
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                unitPrice: "$$item.unitPrice",
                tax: "$$item.tax",
                itemDiscount: "$$item.itemDiscount",
                totalPrice: "$$item.totalPrice",
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Final projection to select the desired fields
      {
        $project: {
          orderId: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          customerDetails: {
            firstName: "$customerDetails.firstName",
            lastName: "$customerDetails.lastName",
            phoneNumber: "$customerDetails.phoneNumber",
            email: "$customerDetails.email",
          },
          sellerDetails: {
            shopName: "$sellerDetails.shopName",
            phoneNum: "$sellerDetails.phoneNum",
            email: "$sellerDetails.email",
            address: "$sellerDetails.address",
            shopLogo: "$sellerDetails.shopLogo",
          },
          billingAddressDetails: {
            contactPersonName: "$customerAddressDetails.billingAddress.contactPersonName",
            phone: "$customerAddressDetails.billingAddress.phone",
            addressType: "$customerAddressDetails.billingAddress.addressType",
            address: "$customerAddressDetails.billingAddress.address",
            city: "$customerAddressDetails.billingAddress.city",
            zipCode: "$customerAddressDetails.billingAddress.zipCode",
            country: "$customerAddressDetails.billingAddress.country",
            note: "$customerAddressDetails.billingAddress.note",
          },
          shippingAddressDetails: {
            contactPersonName: "$customerAddressDetails.shippingAddress.contactPersonName",
            phone: "$customerAddressDetails.shippingAddress.phone",
            addressType: "$customerAddressDetails.shippingAddress.addressType",
            address: "$customerAddressDetails.shippingAddress.address",
            city: "$customerAddressDetails.shippingAddress.city",
            zipCode: "$customerAddressDetails.shippingAddress.zipCode",
            country: "$customerAddressDetails.shippingAddress.country",
            note: "$customerAddressDetails.shippingAddress.note",
          },
          orderItems: 1,
        },
      },

      // Sorting, Pagination
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count the total number of orders matching the conditions for pagination
    const totalOrders = await Order.countDocuments(matchConditions);

    // Execute the aggregation pipeline to fetch the orders
    const allOrders = await Order.aggregate(aggregatePipeline);

    // Return the response with pagination data
    return res.status(200).json({
      success: true,
      message: "Canceled orders fetched successfully.",
      data: allOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending orders.",
      error: error.message,
    });
  }
};

// get all packaging orders
export const getAllReturnedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Page number, defaults to 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, defaults to 10
    const skip = (page - 1) * limit; // Skipping records for pagination

    const { orderStatus, store, customer, dateType, searchQuery } = req.query;

    console.log(req.query); // Log the query params for debugging

    // Default match condition: only 'Pending' orders
    const matchConditions = { status: "Returned" };

    // Filter by specific order status if provided
    if (orderStatus) {
      matchConditions.status = orderStatus;
    }

    // Filter by store/shop name if provided
    if (store) {
      matchConditions["sellerDetails.shopName"] = { $regex: new RegExp(store, "i") };
    }

    // Filter by customer details (first name, last name, or phone number)
    if (customer) {
      const cleanedCustomer = customer.trim(); // Clean up customer input
      matchConditions.$or = [
        { "customerDetails.firstName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.lastName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.phoneNumber": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
      ];
    }

    // Filter by date range based on `dateType` (thisWeek, thisMonth, thisYear)
    if (dateType) {
      const today = new Date();
      if (dateType === "thisWeek") {
        matchConditions.createdAt = { $gte: new Date(today.setDate(today.getDate() - today.getDay())) };
      } else if (dateType === "thisMonth") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), today.getMonth(), 1) };
      } else if (dateType === "thisYear") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), 0, 1) };
      }
    }

    // Add search filter if provided (search across orderId, customer email, or seller shop name)
    if (searchQuery) {
      matchConditions.$or = matchConditions.$or || [];
      matchConditions.$or.push(
        { orderId: { $regex: searchQuery, $options: "i" } },
        { "customerDetails.email": { $regex: searchQuery, $options: "i" } },
        { "sellerDetails.shopName": { $regex: searchQuery, $options: "i" } }
      );
    }

    // Aggregation pipeline to fetch orders with related data
    const aggregatePipeline = [
      {
        $lookup: {
          from: "customers", // Join with the "customers" collection
          localField: "customer", // Field in orders collection
          foreignField: "_id", // Field in customers collection
          as: "customerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$customerDetails" },

      {
        $lookup: {
          from: "customeraddresses", // Join with the "customeraddresses" collection
          localField: "customerAddress", // Field in orders collection
          foreignField: "_id", // Field in customeraddresses collection
          as: "customerAddressDetails", // Alias for the joined data
        },
      },
      { $unwind: { path: "$customerAddressDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sellers", // Join with the "sellers" collection
          localField: "seller", // Field in orders collection
          foreignField: "_id", // Field in sellers collection
          as: "sellerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$sellerDetails" },

      {
        $lookup: {
          from: "products", // Join with the "products" collection
          localField: "orderItems.productId", // Field in orderItems
          foreignField: "_id", // Field in products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Match the filter conditions after performing the joins
      { $match: matchConditions },

      // Map product details into orderItems
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                unitPrice: "$$item.unitPrice",
                tax: "$$item.tax",
                itemDiscount: "$$item.itemDiscount",
                totalPrice: "$$item.totalPrice",
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Final projection to select the desired fields
      {
        $project: {
          orderId: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          customerDetails: {
            firstName: "$customerDetails.firstName",
            lastName: "$customerDetails.lastName",
            phoneNumber: "$customerDetails.phoneNumber",
            email: "$customerDetails.email",
          },
          sellerDetails: {
            shopName: "$sellerDetails.shopName",
            phoneNum: "$sellerDetails.phoneNum",
            email: "$sellerDetails.email",
            address: "$sellerDetails.address",
            shopLogo: "$sellerDetails.shopLogo",
          },
          billingAddressDetails: {
            contactPersonName: "$customerAddressDetails.billingAddress.contactPersonName",
            phone: "$customerAddressDetails.billingAddress.phone",
            addressType: "$customerAddressDetails.billingAddress.addressType",
            address: "$customerAddressDetails.billingAddress.address",
            city: "$customerAddressDetails.billingAddress.city",
            zipCode: "$customerAddressDetails.billingAddress.zipCode",
            country: "$customerAddressDetails.billingAddress.country",
            note: "$customerAddressDetails.billingAddress.note",
          },
          shippingAddressDetails: {
            contactPersonName: "$customerAddressDetails.shippingAddress.contactPersonName",
            phone: "$customerAddressDetails.shippingAddress.phone",
            addressType: "$customerAddressDetails.shippingAddress.addressType",
            address: "$customerAddressDetails.shippingAddress.address",
            city: "$customerAddressDetails.shippingAddress.city",
            zipCode: "$customerAddressDetails.shippingAddress.zipCode",
            country: "$customerAddressDetails.shippingAddress.country",
            note: "$customerAddressDetails.shippingAddress.note",
          },
          orderItems: 1,
        },
      },

      // Sorting, Pagination
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count the total number of orders matching the conditions for pagination
    const totalOrders = await Order.countDocuments(matchConditions);

    // Execute the aggregation pipeline to fetch the orders
    const allOrders = await Order.aggregate(aggregatePipeline);

    // Return the response with pagination data
    return res.status(200).json({
      success: true,
      message: "Returned orders fetched successfully.",
      data: allOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending orders.",
      error: error.message,
    });
  }
};

// get all packaging orders
export const getAllDeliveredOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Page number, defaults to 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, defaults to 10
    const skip = (page - 1) * limit; // Skipping records for pagination

    const { orderStatus, store, customer, dateType, searchQuery } = req.query;

    console.log(req.query); // Log the query params for debugging

    // Default match condition: only 'Pending' orders
    const matchConditions = { status: "Delivered" };

    // Filter by specific order status if provided
    if (orderStatus) {
      matchConditions.status = orderStatus;
    }

    // Filter by store/shop name if provided
    if (store) {
      matchConditions["sellerDetails.shopName"] = { $regex: new RegExp(store, "i") };
    }

    // Filter by customer details (first name, last name, or phone number)
    if (customer) {
      const cleanedCustomer = customer.trim(); // Clean up customer input
      matchConditions.$or = [
        { "customerDetails.firstName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.lastName": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
        { "customerDetails.phoneNumber": { $regex: `^${cleanedCustomer}$`, $options: "i" } },
      ];
    }

    // Filter by date range based on `dateType` (thisWeek, thisMonth, thisYear)
    if (dateType) {
      const today = new Date();
      if (dateType === "thisWeek") {
        matchConditions.createdAt = { $gte: new Date(today.setDate(today.getDate() - today.getDay())) };
      } else if (dateType === "thisMonth") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), today.getMonth(), 1) };
      } else if (dateType === "thisYear") {
        matchConditions.createdAt = { $gte: new Date(today.getFullYear(), 0, 1) };
      }
    }

    // Add search filter if provided (search across orderId, customer email, or seller shop name)
    if (searchQuery) {
      matchConditions.$or = matchConditions.$or || [];
      matchConditions.$or.push(
        { orderId: { $regex: searchQuery, $options: "i" } },
        { "customerDetails.email": { $regex: searchQuery, $options: "i" } },
        { "sellerDetails.shopName": { $regex: searchQuery, $options: "i" } }
      );
    }

    // Aggregation pipeline to fetch orders with related data
    const aggregatePipeline = [
      {
        $lookup: {
          from: "customers", // Join with the "customers" collection
          localField: "customer", // Field in orders collection
          foreignField: "_id", // Field in customers collection
          as: "customerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$customerDetails" },

      {
        $lookup: {
          from: "customeraddresses", // Join with the "customeraddresses" collection
          localField: "customerAddress", // Field in orders collection
          foreignField: "_id", // Field in customeraddresses collection
          as: "customerAddressDetails", // Alias for the joined data
        },
      },
      { $unwind: { path: "$customerAddressDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sellers", // Join with the "sellers" collection
          localField: "seller", // Field in orders collection
          foreignField: "_id", // Field in sellers collection
          as: "sellerDetails", // Alias for the joined data
        },
      },
      { $unwind: "$sellerDetails" },

      {
        $lookup: {
          from: "products", // Join with the "products" collection
          localField: "orderItems.productId", // Field in orderItems
          foreignField: "_id", // Field in products collection
          as: "productDetails", // Alias for the joined data
        },
      },

      // Match the filter conditions after performing the joins
      { $match: matchConditions },

      // Map product details into orderItems
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                unitPrice: "$$item.unitPrice",
                tax: "$$item.tax",
                itemDiscount: "$$item.itemDiscount",
                totalPrice: "$$item.totalPrice",
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Final projection to select the desired fields
      {
        $project: {
          orderId: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          customerDetails: {
            firstName: "$customerDetails.firstName",
            lastName: "$customerDetails.lastName",
            phoneNumber: "$customerDetails.phoneNumber",
            email: "$customerDetails.email",
          },
          sellerDetails: {
            shopName: "$sellerDetails.shopName",
            phoneNum: "$sellerDetails.phoneNum",
            email: "$sellerDetails.email",
            address: "$sellerDetails.address",
            shopLogo: "$sellerDetails.shopLogo",
          },
          billingAddressDetails: {
            contactPersonName: "$customerAddressDetails.billingAddress.contactPersonName",
            phone: "$customerAddressDetails.billingAddress.phone",
            addressType: "$customerAddressDetails.billingAddress.addressType",
            address: "$customerAddressDetails.billingAddress.address",
            city: "$customerAddressDetails.billingAddress.city",
            zipCode: "$customerAddressDetails.billingAddress.zipCode",
            country: "$customerAddressDetails.billingAddress.country",
            note: "$customerAddressDetails.billingAddress.note",
          },
          shippingAddressDetails: {
            contactPersonName: "$customerAddressDetails.shippingAddress.contactPersonName",
            phone: "$customerAddressDetails.shippingAddress.phone",
            addressType: "$customerAddressDetails.shippingAddress.addressType",
            address: "$customerAddressDetails.shippingAddress.address",
            city: "$customerAddressDetails.shippingAddress.city",
            zipCode: "$customerAddressDetails.shippingAddress.zipCode",
            country: "$customerAddressDetails.shippingAddress.country",
            note: "$customerAddressDetails.shippingAddress.note",
          },
          orderItems: 1,
        },
      },

      // Sorting, Pagination
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count the total number of orders matching the conditions for pagination
    const totalOrders = await Order.countDocuments(matchConditions);

    // Execute the aggregation pipeline to fetch the orders
    const allOrders = await Order.aggregate(aggregatePipeline);

    // Return the response with pagination data
    return res.status(200).json({
      success: true,
      message: "Delivered orders fetched successfully.",
      data: allOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending orders.",
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params; // Extract the order ID from request parameters

    // Check if ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    // Fetch the order by ID to ensure it exists
    const orderExists = await Order.findById(id);
    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const matchConditions = { _id: orderExists._id };

    const aggregatePipeline = [
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      { $unwind: "$customerDetails" },

      {
        $lookup: {
          from: "customeraddresses",
          localField: "customerAddress",
          foreignField: "_id",
          as: "customerAddressDetails",
        },
      },
      { $unwind: { path: "$customerAddressDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sellers",
          localField: "seller",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      { $unwind: "$sellerDetails" },

      // Lookup product details and map them to orderItems
      {
        $lookup: {
          from: "products",
          localField: "orderItems.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      // Match the conditions after joining
      { $match: matchConditions },

      // Map productDetails to each orderItem
      {
        $addFields: {
          orderItems: {
            $map: {
              input: "$orderItems",
              as: "item",
              in: {
                productId: "$$item.productId",
                quantity: "$$item.quantity",
                unitPrice: "$$item.unitPrice",
                tax: "$$item.tax",
                itemDiscount: "$$item.itemDiscount",
                totalPrice: "$$item.totalPrice",
                productDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "product",
                        cond: { $eq: ["$$product._id", "$$item.productId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Final projection
      {
        $project: {
          orderId: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          paymentMethod:1,
          paymentStatus:1,
          verificationCode:1,
          customerDetails: {
            firstName: "$customerDetails.firstName",
            lastName: "$customerDetails.lastName",
            phoneNumber: "$customerDetails.phoneNumber",
            email: "$customerDetails.email",
            customerLogo: "$customerDetails.customerLogo"
          },
          sellerDetails: {
            shopName: "$sellerDetails.shopName",
            phoneNum: "$sellerDetails.phoneNum",
            shopLogo: "$sellerDetails.shopLogo",
            email: "$sellerDetails.email",
            address: "$sellerDetails.address",
            
          },
          billingAddressDetails: {
            contactPersonName: "$customerAddressDetails.billingAddress.contactPersonName",
            phone: "$customerAddressDetails.billingAddress.phone",
            addressType: "$customerAddressDetails.billingAddress.addressType",
            address: "$customerAddressDetails.billingAddress.address",
            city: "$customerAddressDetails.billingAddress.city",
            zipCode: "$customerAddressDetails.billingAddress.zipCode",
            country: "$customerAddressDetails.billingAddress.country",
            note: "$customerAddressDetails.billingAddress.note",
          },
          shippingAddressDetails: {
            contactPersonName: "$customerAddressDetails.shippingAddress.contactPersonName",
            phone: "$customerAddressDetails.shippingAddress.phone",
            addressType: "$customerAddressDetails.shippingAddress.addressType",
            address: "$customerAddressDetails.shippingAddress.address",
            city: "$customerAddressDetails.shippingAddress.city",
            zipCode: "$customerAddressDetails.shippingAddress.zipCode",
            country: "$customerAddressDetails.shippingAddress.country",
            note: "$customerAddressDetails.shippingAddress.note",
          },
          orderItems: 1,
        },
      },
    ];

    // Execute the aggregation pipeline
    const order = await Order.aggregate(aggregatePipeline);

    // Return the aggregated order data
    return res.status(200).json({
      success: true,
      message: "Order fetched successfully.",
      data: order[0], // Return the first (and only) matched order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the order.",
      error: error.message,
    });
  }
};


// Export Pending Orders
export const pendingOrdersExport = async (req, res) => {
  const { format } = req.query; // 'excel' or 'csv'
  console.log(req.query);

  try {
    // Fetch only 'Pending' orders and populate necessary fields
    const orders = await Order.find({ status: 'Pending' })
      .populate('customer seller customerAddress orderItems.productId'); // Populate necessary fields

    console.log(orders);

    // Export as Excel
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pending Orders');

      // Define columns
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Customer Email', key: 'customerEmail' },
        { header: 'Seller Shop Name', key: 'sellerShopName' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Verification Code', key: 'verificationCode' },
        { header: 'Total', key: 'total' },
        { header: 'Order Items', key: 'orderItems' },
        { header: 'Created At', key: 'createdAt' },
      ];

      // Add rows to worksheet
      orders.forEach(order => {
        // Concatenate orderItems into a readable string
        const orderItems = order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; ');

        worksheet.addRow({
          orderId: order.orderId,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          customerEmail: order.customer.email,
          sellerShopName: order.seller.shopName,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          verificationCode: order.verificationCode,
          total: order.total,
          orderItems, // Include the formatted order items
          createdAt: order.createdAt,
        });
      });

      // Write to buffer and send response as Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename=pending_orders.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);

    // Export as CSV
    } else if (format === 'csv') {
      const csv = parse(orders.map(order => ({
        orderId: order.orderId,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        sellerShopName: order.seller.shopName,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        verificationCode: order.verificationCode,
        total: order.total,
        // Concatenate orderItems into a string for CSV
        orderItems: order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; '),
        createdAt: order.createdAt,
      })), {
        fields: [
          'orderId',
          'customerName',
          'customerEmail',
          'sellerShopName',
          'paymentStatus',
          'paymentMethod',
          'verificationCode',
          'total',
          'orderItems',
          'createdAt'
        ],
      });

      // Send response as CSV file
      res.setHeader('Content-Disposition', 'attachment; filename=pending_orders.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);

    } else {
      return res.status(400).json({ error: 'Invalid format. Use "excel" or "csv".' });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    return res.status(500).json({ error: 'Failed to generate the export file.' });
  }
};

// Export Confirmed Orders
export const confirmedOrdersExport = async (req, res) => {
  const { format } = req.query; // 'excel' or 'csv'
  console.log(req.query);

  try {
    // Fetch only 'Confirmed' orders and populate necessary fields
    const orders = await Order.find({ status: 'Confirmed' })
      .populate('customer seller customerAddress orderItems.productId'); // Populate necessary fields

    console.log(orders);

    // Export as Excel
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Confirmed Orders');

      // Define columns
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Customer Email', key: 'customerEmail' },
        { header: 'Seller Shop Name', key: 'sellerShopName' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Verification Code', key: 'verificationCode' },
        { header: 'Total', key: 'total' },
        { header: 'Order Items', key: 'orderItems' },
        { header: 'Created At', key: 'createdAt' },
      ];

      // Add rows to worksheet
      orders.forEach(order => {
        // Concatenate orderItems into a readable string
        const orderItems = order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; ');

        worksheet.addRow({
          orderId: order.orderId,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          customerEmail: order.customer.email,
          sellerShopName: order.seller.shopName,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          verificationCode: order.verificationCode,
          total: order.total,
          orderItems, // Include the formatted order items
          createdAt: order.createdAt,
        });
      });

      // Write to buffer and send response as Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename=confirmed_orders.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);

    // Export as CSV
    } else if (format === 'csv') {
      const csv = parse(orders.map(order => ({
        orderId: order.orderId,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        sellerShopName: order.seller.shopName,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        verificationCode: order.verificationCode,
        total: order.total,
        // Concatenate orderItems into a string for CSV
        orderItems: order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; '),
        createdAt: order.createdAt,
      })), {
        fields: [
          'orderId',
          'customerName',
          'customerEmail',
          'sellerShopName',
          'paymentStatus',
          'paymentMethod',
          'verificationCode',
          'total',
          'orderItems',
          'createdAt'
        ],
      });

      // Send response as CSV file
      res.setHeader('Content-Disposition', 'attachment; filename=confirmed_orders.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);

    } else {
      return res.status(400).json({ error: 'Invalid format. Use "excel" or "csv".' });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    return res.status(500).json({ error: 'Failed to generate the export file.' });
  }
};

// Export Confirmed Orders
export const packagingOrdersExport = async (req, res) => {
  const { format } = req.query; // 'excel' or 'csv'
  console.log(req.query);

  try {
    // Fetch only 'Confirmed' orders and populate necessary fields
    const orders = await Order.find({ status: 'Packaging' })
      .populate('customer seller customerAddress orderItems.productId'); // Populate necessary fields

    console.log(orders);

    // Export as Excel
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Packaging Orders');

      // Define columns
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Customer Email', key: 'customerEmail' },
        { header: 'Seller Shop Name', key: 'sellerShopName' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Verification Code', key: 'verificationCode' },
        { header: 'Total', key: 'total' },
        { header: 'Order Items', key: 'orderItems' },
        { header: 'Created At', key: 'createdAt' },
      ];

      // Add rows to worksheet
      orders.forEach(order => {
        // Concatenate orderItems into a readable string
        const orderItems = order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; ');

        worksheet.addRow({
          orderId: order.orderId,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          customerEmail: order.customer.email,
          sellerShopName: order.seller.shopName,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          verificationCode: order.verificationCode,
          total: order.total,
          orderItems, // Include the formatted order items
          createdAt: order.createdAt,
        });
      });

      // Write to buffer and send response as Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename=packaging_orders.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);

    // Export as CSV
    } else if (format === 'csv') {
      const csv = parse(orders.map(order => ({
        orderId: order.orderId,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        sellerShopName: order.seller.shopName,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        verificationCode: order.verificationCode,
        total: order.total,
        // Concatenate orderItems into a string for CSV
        orderItems: order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; '),
        createdAt: order.createdAt,
      })), {
        fields: [
          'orderId',
          'customerName',
          'customerEmail',
          'sellerShopName',
          'paymentStatus',
          'paymentMethod',
          'verificationCode',
          'total',
          'orderItems',
          'createdAt'
        ],
      });

      // Send response as CSV file
      res.setHeader('Content-Disposition', 'attachment; filename=packaging_orders.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);

    } else {
      return res.status(400).json({ error: 'Invalid format. Use "excel" or "csv".' });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    return res.status(500).json({ error: 'Failed to generate the export file.' });
  }
};

// Export Confirmed Orders
export const canceledOrdersExport = async (req, res) => {
  const { format } = req.query; // 'excel' or 'csv'
  console.log(req.query);

  try {
    // Fetch only 'Confirmed' orders and populate necessary fields
    const orders = await Order.find({ status: 'Canceled' })
      .populate('customer seller customerAddress orderItems.productId'); // Populate necessary fields

    console.log(orders);

    // Export as Excel
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Canceled Orders');

      // Define columns
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Customer Email', key: 'customerEmail' },
        { header: 'Seller Shop Name', key: 'sellerShopName' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Verification Code', key: 'verificationCode' },
        { header: 'Total', key: 'total' },
        { header: 'Order Items', key: 'orderItems' },
        { header: 'Created At', key: 'createdAt' },
      ];

      // Add rows to worksheet
      orders.forEach(order => {
        // Concatenate orderItems into a readable string
        const orderItems = order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; ');

        worksheet.addRow({
          orderId: order.orderId,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          customerEmail: order.customer.email,
          sellerShopName: order.seller.shopName,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          verificationCode: order.verificationCode,
          total: order.total,
          orderItems, // Include the formatted order items
          createdAt: order.createdAt,
        });
      });

      // Write to buffer and send response as Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename=canceled_orders.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);

    // Export as CSV
    } else if (format === 'csv') {
      const csv = parse(orders.map(order => ({
        orderId: order.orderId,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        sellerShopName: order.seller.shopName,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        verificationCode: order.verificationCode,
        total: order.total,
        // Concatenate orderItems into a string for CSV
        orderItems: order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; '),
        createdAt: order.createdAt,
      })), {
        fields: [
          'orderId',
          'customerName',
          'customerEmail',
          'sellerShopName',
          'paymentStatus',
          'paymentMethod',
          'verificationCode',
          'total',
          'orderItems',
          'createdAt'
        ],
      });

      // Send response as CSV file
      res.setHeader('Content-Disposition', 'attachment; filename=canceled_orders.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);

    } else {
      return res.status(400).json({ error: 'Invalid format. Use "excel" or "csv".' });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    return res.status(500).json({ error: 'Failed to generate the export file.' });
  }
};

// Export Confirmed Orders
export const returnedOrdersExport = async (req, res) => {
  const { format } = req.query; // 'excel' or 'csv'
  console.log(req.query);

  try {
    // Fetch only 'Confirmed' orders and populate necessary fields
    const orders = await Order.find({ status: 'Returned' })
      .populate('customer seller customerAddress orderItems.productId'); // Populate necessary fields

    console.log(orders);

    // Export as Excel
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Returned Orders');

      // Define columns
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Customer Email', key: 'customerEmail' },
        { header: 'Seller Shop Name', key: 'sellerShopName' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Verification Code', key: 'verificationCode' },
        { header: 'Total', key: 'total' },
        { header: 'Order Items', key: 'orderItems' },
        { header: 'Created At', key: 'createdAt' },
      ];

      // Add rows to worksheet
      orders.forEach(order => {
        // Concatenate orderItems into a readable string
        const orderItems = order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; ');

        worksheet.addRow({
          orderId: order.orderId,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          customerEmail: order.customer.email,
          sellerShopName: order.seller.shopName,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          verificationCode: order.verificationCode,
          total: order.total,
          orderItems, // Include the formatted order items
          createdAt: order.createdAt,
        });
      });

      // Write to buffer and send response as Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename=returned_orders.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);

    // Export as CSV
    } else if (format === 'csv') {
      const csv = parse(orders.map(order => ({
        orderId: order.orderId,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        sellerShopName: order.seller.shopName,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        verificationCode: order.verificationCode,
        total: order.total,
        // Concatenate orderItems into a string for CSV
        orderItems: order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; '),
        createdAt: order.createdAt,
      })), {
        fields: [
          'orderId',
          'customerName',
          'customerEmail',
          'sellerShopName',
          'paymentStatus',
          'paymentMethod',
          'verificationCode',
          'total',
          'orderItems',
          'createdAt'
        ],
      });

      // Send response as CSV file
      res.setHeader('Content-Disposition', 'attachment; filename=returned_orders.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);

    } else {
      return res.status(400).json({ error: 'Invalid format. Use "excel" or "csv".' });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    return res.status(500).json({ error: 'Failed to generate the export file.' });
  }
};

// Export Confirmed Orders
export const deliveredExport = async (req, res) => {
  const { format } = req.query; // 'excel' or 'csv'
  console.log(req.query);

  try {
    // Fetch only 'Confirmed' orders and populate necessary fields
    const orders = await Order.find({ status: 'Delivered' })
      .populate('customer seller customerAddress orderItems.productId'); // Populate necessary fields

    console.log(orders);

    // Export as Excel
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Delivered Orders');

      // Define columns
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Customer Email', key: 'customerEmail' },
        { header: 'Seller Shop Name', key: 'sellerShopName' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Verification Code', key: 'verificationCode' },
        { header: 'Total', key: 'total' },
        { header: 'Order Items', key: 'orderItems' },
        { header: 'Created At', key: 'createdAt' },
      ];

      // Add rows to worksheet
      orders.forEach(order => {
        // Concatenate orderItems into a readable string
        const orderItems = order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; ');

        worksheet.addRow({
          orderId: order.orderId,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          customerEmail: order.customer.email,
          sellerShopName: order.seller.shopName,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          verificationCode: order.verificationCode,
          total: order.total,
          orderItems, // Include the formatted order items
          createdAt: order.createdAt,
        });
      });

      // Write to buffer and send response as Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename=delivered_orders.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);

    // Export as CSV
    } else if (format === 'csv') {
      const csv = parse(orders.map(order => ({
        orderId: order.orderId,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        sellerShopName: order.seller.shopName,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        verificationCode: order.verificationCode,
        total: order.total,
        // Concatenate orderItems into a string for CSV
        orderItems: order.orderItems.map(item => {
          return `${item.productId.productTitle} (Qty: ${item.quantity}, Price: ${item.unitPrice}, Total: ${item.totalPrice})`;
        }).join('; '),
        createdAt: order.createdAt,
      })), {
        fields: [
          'orderId',
          'customerName',
          'customerEmail',
          'sellerShopName',
          'paymentStatus',
          'paymentMethod',
          'verificationCode',
          'total',
          'orderItems',
          'createdAt'
        ],
      });

      // Send response as CSV file
      res.setHeader('Content-Disposition', 'attachment; filename=delivered_orders.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);

    } else {
      return res.status(400).json({ error: 'Invalid format. Use "excel" or "csv".' });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    return res.status(500).json({ error: 'Failed to generate the export file.' });
  }
};