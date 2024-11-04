import DealOfTheDay from '../models/DealOfTheDay.js';
  import Product from '../models/Product.js';
// Controller to create a new Deal of the Day
export const addDealOfTheDay = async (req, res) => {
  try {
    const { title, product, status = 'Active' } = req.body; // Set default value if not provided
    console.log(req.body)
    // Validate request body
    if (!title || !product) {
      return res.status(400).json({ message: 'Title and products are required' });
    }

    // Create a new Deal of the Day instance
    const newDeal = new DealOfTheDay({
      title,
      product,
      status,
    });

    // Save the new deal to the database
    const savedDeal = await newDeal.save();

    res.status(201).json({
      message: 'Deal of the Day added successfully',
      deal: savedDeal,
    });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while adding the deal', error: error.message });
  }
};


export const getAllDealOfTheDay = async (req, res) => {
    try {
      // Fetch all deals and populate the product details
      const deals = await DealOfTheDay.find().populate('product');
  
      if (!deals) {
        return res.status(404).json({ message: 'No deals found' });
      }
  
      // Send the populated deals as the response
      res.status(200).json({
        success: true,
        data: deals,
      });
    } catch (error) {
      console.error('Error fetching deals:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  };

  export const updateDealStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      const updatedDeal = await DealOfTheDay.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
  
      if (!updatedDeal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
  
      res.status(200).json({
        success: true,
        data: updatedDeal,
      });
    } catch (error) {
      console.error('Error updating deal status:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  };

  
  
  export const updateDealOfTheDay = async (req, res) => {
    try {
      const { id } = req.params; // Get the deal ID from the route parameters
      const { title, product, status } = req.body; // Get new values from the request body
      // Find the existing deal
      const existingDeal = await DealOfTheDay.findById(id);
  
      if (!existingDeal) {
        return res.status(404).json({ success: false, message: 'Deal not found' });
      }
  
      // Update fields only if provided in the request, otherwise retain existing values
      existingDeal.title = title !== undefined ? title : existingDeal.title;
      existingDeal.product = product !== undefined ? product : existingDeal.product;
      existingDeal.status = status !== undefined ? status : existingDeal.status;
  
      // Validate if the provided product ID exists (optional, but recommended)
      if (product) {
        const productExists = await Product.findById(product);
        if (!productExists) {
          return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
      }
  
      // Save the updated deal to the database
      const updatedDeal = await existingDeal.save();
  
      res.status(200).json({
        success: true,
        message: 'Deal of the Day updated successfully',
        data: updatedDeal,
      });
    } catch (error) {
      console.error('Error updating deal:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  };
  
// Controller to delete a "Deal of the Day"
export const deleteDealOfTheDay = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Check if the deal exists
      const deal = await DealOfTheDay.findById(id);
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
  
      // Delete the deal from the database
      await DealOfTheDay.findByIdAndDelete(id);
  
      res.status(200).json({ message: 'Deal deleted successfully' });
    } catch (error) {
      console.error('Error deleting deal:', error);
      res.status(500).json({ message: 'Internal server error', error });
    }
  };