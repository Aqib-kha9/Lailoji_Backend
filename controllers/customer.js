import Customer from '../models/Customer.js'; // Import the customer model
import bcrypt from 'bcrypt'; // To hash passwords
import jwt from 'jsonwebtoken'; // For authentication token generation (if needed)
import cloudinary from 'cloudinary';
import Order from '../models/Order.js';

// Login or create customer function
export const loginOrCreateCustomer = async (req, res) => {
  const { phoneNumber, password } = req.body;

  // Ensure phone number and password are provided
  if (!phoneNumber || !password) {
    return res.status(400).json({ message: 'Phone number and password are required.' });
  }

  try {
    // Check if the customer already exists
    let customer = await Customer.findOne({ phoneNumber });

    if (customer) {
      // If customer exists, compare the password
      const isMatch = await bcrypt.compare(password, customer.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // If password matches, return success and optionally generate a token
      const token = jwt.sign({ id: customer._id }, 'your_secret_key', { expiresIn: '1h' });
      return res.status(200).json({ message: 'Login successful', token, customer });

    } else {
      // If customer does not exist, create a new customer
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

      const newCustomer = new Customer({
        phoneNumber,
        password: hashedPassword,
        firstName: null, // Set all other fields to null if not provided
        lastName: null,
        email: null,
        customerLogo: null
      });

      // Save the new customer to the database
      await newCustomer.save();

      // Generate a token for the new customer
      const token = jwt.sign({ id: newCustomer._id }, 'your_secret_key', { expiresIn: '1h' });

      return res.status(201).json({ message: 'Customer created successfully', token, customer: newCustomer });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update customer details
export const updateCustomerDetails = async (req, res) => {
    const { customerId } = req.params; // Get customerId from URL
    const { firstName, lastName, email, phoneNumber } = req.body; // Extract fields from request body
  
    try {
        // Find the customer by their ID
        let customer = await Customer.findById(customerId);
  
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
  
        // Check if phone number is updated and ensure it's unique
        if (phoneNumber !== undefined) {
            const existingCustomer = await Customer.findOne({ phoneNumber });
            if (existingCustomer && existingCustomer._id.toString() !== customerId) {
                return res.status(400).json({ message: 'Phone number already exists' });
            }
            customer.phoneNumber = phoneNumber;
        }
  
        // Update other fields if they are provided in the request body
        if (firstName !== undefined) customer.firstName = firstName;
        if (lastName !== undefined) customer.lastName = lastName;
        if (email !== undefined) customer.email = email;
  
        // If a file (image) is uploaded, update the customerLogo field with Cloudinary URL
        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'CustomerLogo', // Folder in Cloudinary
                public_id: `${Date.now()}-${req.file.originalname}`, // Unique file name
            });
            customer.customerLogo = result.secure_url; // Update with the secure Cloudinary URL
        }
  
        // Save the updated customer information
        await customer.save();
  
        return res.status(200).json({ message: 'Customer updated successfully', customer });
  
    } catch (error) {
        console.error('Error updating customer:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// Get all customers with their total orders
export const getAllCustomersWithOrders = async (req, res) => {
  try {
    // Fetch all customers
    const customers = await Customer.find();

    // Calculate total orders for each customer
    const customersWithOrderCounts = await Promise.all(
      customers.map(async (customer) => {
        const totalOrders = await Order.countDocuments({ customer: customer._id });
        return {
          ...customer.toObject(),
          totalOrders
        };
      })
    );

    res.status(200).json(customersWithOrderCounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

// Get a single customer by ID
export const getCustomerById = async (req, res) => {
    try {
      const { id } = req.params; // Extract the customer ID from the request parameters
  
      // Fetch the customer using the provided ID
      const customer = await Customer.findById(id);
  
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
  
      res.status(200).json(customer); // Send the customer data without order details
    } catch (error) {
      res.status(500).json({ message: 'Error fetching customer', error: error.message });
    }
};
  

// Toggle the block/unblock status for a customer
export const toggleBlockStatus = async (req, res) => {
    try {
      const { customerId } = req.params;
      const { isBlock } = req.body; // Get the block/unblock status from the request body
  
      // Find the customer by ID
      const customer = await Customer.findById(customerId);
  
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
  
      // Update the `isBlock` field based on the request
      customer.isBlock = isBlock;
  
      // Save the updated customer
      await customer.save();
  
      res.status(200).json({ message: `Customer ${isBlock === 'Block' ? 'blocked' : 'unblocked'} successfully`, customer,success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error updating block status', error: error.message,success:false });

    }
  };
