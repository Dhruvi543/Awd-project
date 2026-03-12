import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCurrentTerms,
  acceptTerms,
  getTermsStatus,
  updateTerms,
  getPrivacyPolicy,
  updatePrivacyPolicy
} from '../controllers/terms.controller.js';

const router = express.Router();

// Public routes - get current T&C and Privacy Policy
router.get('/current', getCurrentTerms);
router.get('/privacy', getPrivacyPolicy);

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

// Admin only - update Privacy Policy
router.put('/privacy/update', requireAuth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
}, updatePrivacyPolicy);

export default router;
