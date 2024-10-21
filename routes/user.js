import express from "express";
import {
  // registerUser,
  // verifyOTPAndRegisterUser,
  requestLoginOTP,
  verifyLoginOTP,
} from "../controllers/user.js";
// import { otpRateLimiter, } from "../middleware/otpRateLimiter.js";
// import authorizeRoles from "../middleware/authorizeRole.js"

const router = express.Router();

// router.post("/register", registerUser);

// router.post("/verifyOTP", verifyOTPAndRegisterUser);

router.post("/login",requestLoginOTP);

router.post("/login/otp",verifyLoginOTP);

export default router;
