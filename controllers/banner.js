import Banner from '../models/Banner.js';
import cloudinary from 'cloudinary';

// Helper function to validate banner ratio based on type
const getValidRatioForType = (type) => {
  const validRatios = {
    'Main Banner': '3:1',
    'Popup Banner': '1:1',
    'Main Section Banner': '4:1',
    'Footer Banner': '2:1'
  };
  return validRatios[type];
};

// Create a new banner
export const createBanner = async (req, res) => {
  console.log(req.body)
  try {
    const { bannerType, bannerUrl, resourceType, product, bannerImageRatio } = req.body;
    const imageFile = req.file.path;

    // Validate banner ratio based on type
    const validRatio = getValidRatioForType(bannerType);
    if (validRatio && validRatio !== bannerImageRatio) {
      return res.status(400).json({ message: `Please select the correct image ratio: ${validRatio} for the ${bannerType}.` });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.v2.uploader.upload(imageFile, {
      folder: 'banners',
      transformation: [
        { aspect_ratio: validRatio.replace(':', ':'), crop: 'fill' } // Enforcing aspect ratio based on type
      ]
    });

    // Create and save banner with Cloudinary URL
    const banner = new Banner({
      bannerType,
      bannerUrl,
      resourceType,
      product,
      bannerImageRatio,
      imageUrl: result.secure_url
    });
    await banner.save();

    res.status(201).json({ message: 'Banner created successfully', banner });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all banners
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().populate('product');
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to update the banner status
export const updateBannerStatus = async (req, res) => {
    const { id } = req.params; // Banner ID from the URL
    const { publish } = req.body; // New isActive status from the request body
  
    try {
      // Update the banner's isActive status
      const updatedBanner = await Banner.findByIdAndUpdate(
        id,
        { publish: publish },
        { new: true } // Option to return the updated document
      );
  
      if (!updatedBanner) {
        return res.status(404).json({ message: "Banner not found" });
      }
  
      res.status(200).json({ message: "Banner status updated successfully", banner: updatedBanner });
    } catch (error) {
      console.error("Error updating banner status:", error);
      res.status(500).json({ message: "Server error, could not update status" });
    }
};

// Get a single banner by ID
export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id).populate('product');
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    // Accessing form data correctly
    const bannerType = req?.body?.bannerType || req?.body?.get("bannerType");
    const bannerImageRatio = req.body.bannerImageRatio || req.body.get("bannerImageRatio");
    const imageFile = req.file?.path;

    console.log("Banner Type:", bannerType);

    // Find the existing banner data to keep existing values where necessary
    const existingBanner = await Banner.findById(req.params.id);
    if (!existingBanner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Validate banner ratio if bannerType is provided
    if (bannerType) {
      const validRatio = getValidRatioForType(bannerType);
      if (validRatio && validRatio !== bannerImageRatio) {
        return res.status(400).json({ message: `Please select the correct image ratio: ${validRatio} for the ${bannerType}.` });
      }
    }

    // Handle image update if a new file is provided
    let imageUrl = existingBanner.imageUrl; // Default to existing image URL
    if (imageFile) {
      const result = await cloudinary.v2.uploader.upload(imageFile, {
        folder: 'banners',
        transformation: [
          { aspect_ratio: (bannerImageRatio || getValidRatioForType(existingBanner?.bannerType)).replace(':', ':'), crop: 'fill' }
        ]
      });
      imageUrl = result.secure_url; // Update with new image URL if file uploaded
    }

    // Create an updated banner object, keeping existing values if not provided in the request
    const updatedBannerData = {
      bannerType: bannerType || existingBanner?.bannerType,
      bannerImageRatio: bannerImageRatio || existingBanner.bannerImageRatio,
      imageUrl, // Either new or existing URL
      bannerUrl: req.body.bannerUrl || req.body.get("bannerUrl") || existingBanner.bannerUrl,
      resourceType: req.body.resourceType || req.body.get("resourceType") || existingBanner.resourceType,
      product: req.body.product || req.body.get("product") || existingBanner.product,
    };

    // Update the banner in the database
    const updatedBanner = await Banner.findByIdAndUpdate(req.params.id, updatedBannerData, { new: true, runValidators: true });

    res.status(200).json({ message: 'Banner updated successfully', updatedBanner });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



// Delete a banner by ID
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
