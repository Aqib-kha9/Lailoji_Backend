import rateLimit from 'express-rate-limit';

export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: 'Too many OTP requests from this IP, please try again after 10 minutes.',
});
