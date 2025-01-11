import express from 'express';
import { createSmsTemplate } from '../controllers/smsTemplate.js';

const router = express.Router();

// Route to create a new SMS template
router.post('/', createSmsTemplate);

export default router;
