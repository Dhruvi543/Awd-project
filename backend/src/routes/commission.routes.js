import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCommissionSettings,
  updateCommissionSettings,
  getDoctorEarningsDetailed,
  getAdminRevenueStats
} from '../controllers/commission.controller.js';

const router = express.Router();

// Public route - get commission settings
router.get('/settings', getCommissionSettings);

// Protected routes
router.get('/doctor-earnings', requireAuth, (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Access denied. Doctor only.' });
  }
  next();
}, getDoctorEarningsDetailed);

// Admin only routes
router.put('/settings', requireAuth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
}, updateCommissionSettings);

router.get('/admin-revenue', requireAuth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
}, getAdminRevenueStats);

export default router;
