import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCurrentTerms,
  acceptTerms,
  getTermsStatus,
  updateTerms
} from '../controllers/terms.controller.js';

const router = express.Router();

// Public route - get current T&C
router.get('/current', getCurrentTerms);

// Protected routes - require authentication
router.post('/accept', requireAuth, acceptTerms);
router.get('/status', requireAuth, getTermsStatus);

// Admin only - update T&C
router.put('/update', requireAuth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
}, updateTerms);

export default router;
