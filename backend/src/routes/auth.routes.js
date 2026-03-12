import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, googleLogin } from '../controllers/auth.controller.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  }
});

const googleLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 Google login attempts per window
  message: {
    success: false,
    message: 'Too many Google login attempts from this IP, please try again after 15 minutes'
  }
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.post('/google', googleLoginLimiter, googleLogin);

export default router;