import CustomerReview from '../models/CustomerReview.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';


function generateFiveDigitId() {
    // Generate a random number between 10000 and 99999 (5-digit number)
    const uniqueId = Math.floor(10000 + Math.random() * 90000);
  
    return uniqueId;
}
  
  
  // Example usage
  const reviewId = generateFiveDigitId();
  
// Create a new review
export const createReview = async (req, res) => {
  try {
    const {product, customer, rating, review } = req.body;

    // Validate that the product and customer exist
    const productExists = await Product.findById(product);
    const customerExists = await Customer.findById(customer);

    if (!productExists || !customerExists) {
      return res.status(404).json({ message: 'Product or Customer not found' });
    }

    const newReview = new CustomerReview({
      reviewId,
      product,
      customer,
      rating,
      review,
    });

    await newReview.save();
    res.status(201).json({ message: 'Review created successfully', review: newReview });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
};

// Get all reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await CustomerReview.find().populate('product customer');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};


// Update review status
export const updateReviewStatus =  async (req, res) => {
    try {
      const { status } = req.body; // New status from request body
      console.log(status)
      const reviewId = req.params.id;
  
      const updatedReview = await CustomerReview.findByIdAndUpdate(
        reviewId,
        { status },
        { new: true } // Return the updated document
      );
  
      if (!updatedReview) {
        return res.status(404).json({ message: 'Review not found' });
      }
  
      res.status(200).json(updatedReview);
    } catch (error) {
      res.status(500).json({ message: 'Error updating review status', error });
    }
  };

// Get a review by ID
export const getReviewById = async (req, res) => {
  try {
    const review = await CustomerReview.findById(req.params.id).populate('product customer');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch review', error: error.message });
  }
};

// Update a review by ID
export const updateReview = async (req, res) => {
  try {
    const { rating, review, reply, status } = req.body;

    const updatedReview = await CustomerReview.findByIdAndUpdate(
      req.params.id,
      { rating, review, reply, status },
      { new: true } // Return the updated review
    );

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review updated successfully', review: updatedReview });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

// Delete a review by ID
export const deleteReview = async (req, res) => {
  try {
    const deletedReview = await CustomerReview.findByIdAndDelete(req.params.id);

    if (!deletedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};


