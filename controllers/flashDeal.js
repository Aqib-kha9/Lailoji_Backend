import FlashDeal from '../models/FlashDeal.js';
import cloudinary from '../config/cloudinary.js';

export const addFlashDeal = async (req, res) => {
  try {
    const { title, startDate, endDate, products = [] } = req.body; // Default products to an empty array
    console.log(startDate, endDate);

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, Start Date, and End Date are required.' });
    }

    // Create Date objects from the provided strings
    const formattedStartDate = new Date(startDate);
    const formattedEndDate = new Date(endDate);

    // Validate if the dates are valid
    if (isNaN(formattedStartDate.getTime()) || isNaN(formattedEndDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for startDate or endDate.' });
    }

    if (formattedStartDate >= formattedEndDate) {
      return res.status(400).json({ message: 'Start date must be before the end date.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Banner image is required.' });
    }

    // Use Cloudinary's metadata to validate the aspect ratio
    const { path: bannerImageUrl, filename: publicId } = req.file;

    // Retrieve the image's metadata from Cloudinary
    const image = await cloudinary.api.resource(publicId, { image_metadata: true });

    const { width, height } = image;

    // Validate the aspect ratio is approximately 5:1
    const aspectRatio = width / height;
    if (Math.abs(aspectRatio - 5) >= 0.1) {
      await cloudinary.uploader.destroy(publicId); // Delete image if aspect ratio is invalid
      return res.status(400).json({ message: 'Image must have a 5:1 aspect ratio.' });
    }

    const newFlashDeal = new FlashDeal({
      title,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      bannerImage: bannerImageUrl,
      products,
      status: 'Active',
      activeProducts: products.length, // This will be 0 if no products are sent
      isPublished: true,
    });

    const savedFlashDeal = await newFlashDeal.save();
    res.status(201).json({
      message: 'Flash deal created successfully',
      flashDeal: savedFlashDeal,
    });
  } catch (error) {
    console.error('Error creating flash deal:', error);
    res.status(500).json({ message: 'An error occurred while creating the flash deal.', error });
  }
};


// Controller function to get all flash deals
export const getAllFlashDeals = async (req, res) => {
    try {
      const flashDeals = await FlashDeal.find().sort({createdAt:-1}); // Retrieve all flash deals from the database
      res.status(200).json(flashDeals); // Send flash deals as JSON
    } catch (error) {
      console.error("Error fetching flash deals:", error);
      res.status(500).json({ error: "Failed to fetch flash deals" });
    }
  };


// Endpoint to toggle the isPublished status
export const updatePublishedStatus = async (req, res) => {
    const { id } = req.params;
    const { isPublished } = req.body;
    try {
        const flashDeal = await FlashDeal.findByIdAndUpdate(
            id,
            { isPublished },
            { new: true }
        );
        if (!flashDeal) {
            return res.status(404).json({ message: 'Flash Deal not found' });
        }
        res.json({ message: 'Flash Deal status updated', flashDeal });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error });
    }
};


export const updateFlashDeal = async (req, res) => {
  const { id } = req.params; // Get the flash deal ID from the request parameters
  const { title, startDate, endDate, products = [] } = req.body; // Default products to an empty array
  const uploadedFile = req.file; // Access the uploaded file

  try {
    // Retrieve the flash deal by ID
    const flashDeal = await FlashDeal.findById(id);
    if (!flashDeal) {
      return res.status(404).json({ message: 'Flash deal not found' });
    }

    // Format dates and validate date order
    let formattedStartDate, formattedEndDate;

    if (startDate) {
      // If startDate exists, format it to a valid Date object
      formattedStartDate = new Date(startDate);
      if (isNaN(formattedStartDate)) {
        return res.status(400).json({ message: 'Invalid start date format.' });
      }
    }

    if (endDate) {
      // If endDate exists, format it to a valid Date object
      formattedEndDate = new Date(endDate);
      if (isNaN(formattedEndDate)) {
        return res.status(400).json({ message: 'Invalid end date format.' });
      }
    }

    // Validate if startDate is before endDate
    if (formattedStartDate && formattedEndDate && formattedStartDate >= formattedEndDate) {
      return res.status(400).json({ message: 'Start date must be before the end date.' });
    }

    // Update the flash deal fields if provided
    if (title) flashDeal.title = title;
    if (formattedStartDate) flashDeal.startDate = formattedStartDate;
    if (formattedEndDate) flashDeal.endDate = formattedEndDate;
    if (products.length > 0) flashDeal.products = products;
    flashDeal.activeProducts = products.length; // Update active products count

    // If a new file is uploaded, update the banner image with validation
    if (uploadedFile) {
      const { path: bannerImageUrl, filename: publicId } = uploadedFile;

      // Retrieve image metadata for aspect ratio validation
      const image = await cloudinary.api.resource(publicId, { image_metadata: true });
      const { width, height } = image;
      const aspectRatio = width / height;

      // Validate aspect ratio to be close to 5:1
      if (Math.abs(aspectRatio - 5) >= 0.1) {
        await cloudinary.uploader.destroy(publicId); // Delete image if aspect ratio is invalid
        return res.status(400).json({ message: 'Image must have a 5:1 aspect ratio.' });
      }

      // Update the bannerImage if the aspect ratio is valid
      flashDeal.bannerImage = bannerImageUrl;
    }

    // Save the updated flash deal
    const updatedFlashDeal = await flashDeal.save();
    return res.status(200).json({
      message: 'Flash deal updated successfully',
      flashDeal: updatedFlashDeal,
    });
  } catch (error) {
    console.error('Error updating flash deal:', error);
    return res.status(500).json({ message: 'Error updating flash deal', error: error.message });
  }
};


// Delete flash deal by ID
export const deleteFlashDeal = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is valid
    if (!id) {
      return res.status(400).json({ message: "Flash Deal ID is required." });
    }

    // Find and delete the flash deal by ID
    const deletedFlashDeal = await FlashDeal.findByIdAndDelete(id);

    // Check if flash deal was found and deleted
    if (!deletedFlashDeal) {
      return res.status(404).json({ message: "Flash Deal not found." });
    }

    res.status(200).json({
      message: "Flash Deal deleted successfully.",
      flashDeal: deletedFlashDeal,
    });
  } catch (error) {
    console.error("Error deleting Flash Deal:", error);
    res.status(500).json({ message: "Failed to delete Flash Deal.", error });
  }
};

// Controller function to get a flash deal by ID and populate products and their sellers
export const getFlashDealById = async (req, res) => {
  const { id } = req.params; // Get the ID from the request parameters

  try {
    // Find the flash deal by ID and populate the products field along with seller information
    const flashDeal = await FlashDeal.findById(id)
      .populate({
        path: 'products',
        populate: {
          path: 'seller', // Assuming 'seller' is a reference field in the Product schema
          select: '_id name shopName', // Include only specific fields to minimize data load
        },
      });

    if (!flashDeal) {
      return res.status(404).json({ message: "Flash deal not found" });
    }

    // Send the populated flash deal as JSON
    res.status(200).json(flashDeal);
  } catch (error) {
    console.error("Error fetching flash deal by ID:", error);
    res.status(500).json({ error: "Failed to fetch flash deal" });
  }
};



// Route to add products to a flash deal
export const addProductsToAflashDeal = async (req, res) => {
  const { id } = req.params;
  const { productIds } = req.body;

  try {
    // Find the flash deal by ID
    const flashDeal = await FlashDeal.findById(id);

    if (!flashDeal) {
      return res.status(404).json({ message: 'Flash deal not found' });
    }

    // Check for duplicate product IDs
    const existingProductIds = flashDeal.products.map(product => product.toString());
    const duplicateIds = productIds.filter(productId => existingProductIds.includes(productId));

    if (duplicateIds.length > 0) {
      return res.status(400).json({
        message: `Product with ID ${duplicateIds.join(', ')} already exists in the flash deal.`
      });
    }

    // Add unique products
    await flashDeal.addProducts(productIds);

    res.status(200).json({ message: 'Products added successfully', flashDeal });
  } catch (error) {
    console.error('Error adding products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to remove a product from a flash deal
export const removeProductFromFlashDeal = async (req, res) => {
  const { flashDealId, productId } = req.params;

  try {
    const flashDeal = await FlashDeal.findById(flashDealId);

    if (!flashDeal) {
      return res.status(404).json({ message: "Flash deal not found" });
    }

    // Filter out the product with the specified ID
    flashDeal.products = flashDeal.products.filter(
      (id) => id.toString() !== productId
    );

    // Update the activeProducts count
    flashDeal.activeProducts = flashDeal.products.length;

    await flashDeal.save();

    res.status(200).json({ message: "Product removed successfully", flashDeal });
  } catch (error) {
    console.error("Error removing product from flash deal:", error);
    res.status(500).json({ error: "Failed to remove product" });
  }
};


