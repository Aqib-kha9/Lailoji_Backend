// routes/customerAddress.routes.js
import express from 'express';
import {
  createCustomerAddress,
  getCustomerAddresses,
  getCustomerAddressById,
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddressByCustomerId,
} from '../controllers/customerAddress.js';

const router = express.Router();

// POST: Create a new customer address
router.post('/', createCustomerAddress);

// GET: Get all customer addresses
router.get('/', getCustomerAddresses);

// GET: Get a single customer address by ID
router.get('/:id', getCustomerAddressById);

// PUT: Update a customer address by ID
router.put('/:id', updateCustomerAddress);

// DELETE: Delete a customer address by ID
router.delete('/:id', deleteCustomerAddress);

// GET request to get customer address by customer ID
router.get('/:customerId/get', getCustomerAddressByCustomerId);

export default router;
