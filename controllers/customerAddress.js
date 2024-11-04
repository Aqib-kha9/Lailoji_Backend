// controllers/customerAddress.controller.js
import CustomerAddress from '../models/CustomerAddress.js';

// Create a new customer address
export const createCustomerAddress = async (req, res) => {
  try {
    const { customer, billingAddress, shippingAddress } = req.body;
    
    const customerAddress = new CustomerAddress({
      customer,
      billingAddress,
      shippingAddress,
    });

    await customerAddress.save();
    res.status(201).json({ success: true, data: customerAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all customer addresses
export const getCustomerAddresses = async (req, res) => {
  try {
    const addresses = await CustomerAddress.find().populate('customer');
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single customer address by ID
export const getCustomerAddressById = async (req, res) => {
  try {
    const address = await CustomerAddress.findById(req.params.id).populate('customer');
    if (!address) {
      return res.status(404).json({ success: false, message: 'Customer Address not found' });
    }
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a customer address by ID
export const updateCustomerAddress = async (req, res) => {
  try {
    const { billingAddress, shippingAddress } = req.body;

    const address = await CustomerAddress.findByIdAndUpdate(
      req.params.id,
      { billingAddress, shippingAddress },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ success: false, message: 'Customer Address not found' });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a customer address by ID
export const deleteCustomerAddress = async (req, res) => {
  try {
    const address = await CustomerAddress.findByIdAndDelete(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Customer Address not found' });
    }
    res.status(200).json({ success: true, message: 'Customer Address deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Controller function to get customer address by customer ID
export const getCustomerAddressByCustomerId = async (req, res) => {
    const { customerId } = req.params;
  
    try {
      // Fetch customer address by customer ID
      const customerAddress = await CustomerAddress.findOne({ customer: customerId });
  
      if (!customerAddress) {
        return res.status(404).json({ message: 'Customer address not found' });
      }
  
      res.status(200).json(customerAddress);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching customer address', error: error.message });
    }
  };