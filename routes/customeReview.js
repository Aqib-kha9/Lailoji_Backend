import express from 'express';
import {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  updateReviewStatus
} from '../controllers/customerReview.js';

const router = express.Router();

// Route to create a new review
router.post('/', createReview);

// Route to get all reviews
router.get('/', getAllReviews);

// Update Review Status 
router.put("/:id/status",updateReviewStatus)

// Route to get a review by ID
router.get('/:id', getReviewById);

// Route to update a review by ID
router.put('/:id', updateReview);

// Route to delete a review by ID
router.delete('/:id', deleteReview);

export default router; 
