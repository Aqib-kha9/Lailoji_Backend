import User from '../models/User.js';
import OTP from '../models/Otp.js';
import generateOTP from '../utils/generateOTP.js';
import sendOTP from '../utils/sendOTP.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


// // Register User Endpoint
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, phone } = req.body;

//     // Check if the user already exists
//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // Hash the password before storing it
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Generate OTP and save it with expiration time (5 minutes)
//     const otpCode = generateOTP();
//     const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes
//     const otp = new OTP({ email, phone, code: otpCode, name, password: hashedPassword, expiry: otpExpiry });
//     await otp.save();

//     // Send OTP to user's phone or email
//     await sendOTP(phone, otpCode);

//     res.status(200).json({ message: 'OTP sent for verification' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// export const verifyOTPAndRegisterUser = async (req, res) => {
//   try {
//     const { email, phone, otpCode } = req.body;

//     // Find OTP entry in the database
//     const otpEntry = await OTP.findOne({ email, phone, code: otpCode });
//     if (!otpEntry) {
//       return res.status(400).json({ message: 'Invalid OTP' });
//     }

//     // Check if the OTP has expired
//     if (otpEntry.expiry < Date.now()) {
//       return res.status(400).json({ message: 'OTP has expired' });
//     }

//     // OTP verified, register the user
//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // Create and save the user using the data from OTP entry
//     const user = new User({
//       name: otpEntry.name,
//       email,
//       password: otpEntry.password,
//       phone,
//     });
//     await user.save();

//     // Delete OTP from database after successful verification
//     await OTP.deleteOne({ email, phone });

//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


export const requestLoginOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Check if user exists with provided email or phone
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) {
      // If user does not exist, create a new user with a default role (Customer)
      user = new User({ email, phone, role: 'Customer' }); // Default role is 'Customer'
      await user.save();
    }

    // Generate OTP and save it with expiration time (5 minutes)
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes
    const otp = new OTP({ email: user.email, phone: user.phone, code: otpCode, expiry: otpExpiry });
    await otp.save();

    // Send OTP to user's phone or email
    if (phone) {
      await sendOTP(phone, otpCode);
    } else if (email) {
      await sendOTP(email, otpCode);
    }

    res.status(200).json({ message: 'OTP sent for verification' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, phone, otpCode } = req.body;

    // Find OTP entry in the database
    const otpEntry = await OTP.findOne({ $or: [{ email }, { phone }], code: otpCode });
    if (!otpEntry) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if the OTP has expired
    if (otpEntry.expiry < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // OTP verified, find the user and generate a token
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) {
      // If user does not exist, create a new user with a default role
      user = new User({ email, phone, role: 'Customer' });
      await user.save();
    }

    // Generate JWT token for the user including the role
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Include role in JWT
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    // Delete OTP from the database after successful verification
    await OTP.deleteOne({ $or: [{ email }, { phone }] });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
