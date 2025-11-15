import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
} from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.delete('/account', deleteAccount);

export default router;

