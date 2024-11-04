import express from 'express';
import { createNewOrder,getOrdersByCustomerId  } from '../controllers/order.js';

const router = express.Router();

// Route for creating a new order
router.post('/', createNewOrder);

// Route to get orders by customer or seller ID
router.get('/:id', getOrdersByCustomerId);


export default router;
