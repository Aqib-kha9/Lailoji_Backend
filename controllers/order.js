import Order from '../models/Order.js'; // Import the Order model and order ID generator
import Customer from '../models/Customer.js'; // Import Customer model
import Seller from '../models/Seller.js'; // Import Seller model
import Product from '../models/Product.js';

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
