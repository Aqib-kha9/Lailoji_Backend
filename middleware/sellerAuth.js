import jwt from 'jsonwebtoken';
import Seller from '../models/Seller.js'; // Adjust the path based on your project structure

const sellerAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Use Bearer token format
  console.log(token);
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure you set JWT_SECRET in your environment variables

    // Check if sellerId exists in the token
    if (!decoded.sellerId) {
      return res.status(400).json({ message: 'Invalid token structure.' });
    }

    // Find the seller using the ID from the token
    const seller = await Seller.findById(decoded.sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' });
    }

    // Attach the seller information to the request object
    req.seller = seller;
    next(); // Call the next middleware or route handler
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

export default sellerAuth;
