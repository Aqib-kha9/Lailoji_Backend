import express from 'express';
import { loginOrCreateCustomer,updateCustomerDetails,getAllCustomersWithOrders,toggleBlockStatus,getCustomerById } from '../controllers/customer.js'; // Import the login/create controller
import upload from '../middleware/customerLogo.js';
const router = express.Router();

// Route to login or create a new customer
router.post('/login', loginOrCreateCustomer);

// update customer details
router.put('/:customerId', upload.single('customerLogo'), updateCustomerDetails);

// get all customer
router.get("/",getAllCustomersWithOrders);

//get customer by id 

router.get("/:id",getCustomerById);


// Route to toggle the block/unblock status for a customer
router.patch('/:customerId/toggle-block', toggleBlockStatus);

export default router;
