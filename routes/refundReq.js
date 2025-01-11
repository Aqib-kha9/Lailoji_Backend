import express from 'express'
import {createRefund,getRefundsWithSearchAndStatus,exportRefunds} from "../controllers/refundReq.js";
import { handleRefundFileUpload } from '../middleware/refundImages.js';
const router = express.Router();




// Refund creation route
router.post('/', handleRefundFileUpload, createRefund);


// get all getPendingRefunds
router.post('/refund',getRefundsWithSearchAndStatus);

// search handle 
router.get('/export',exportRefunds);








export default router;