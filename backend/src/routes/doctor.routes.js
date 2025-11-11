import express from 'express';
import {
  getDoctors,
  getDoctor,
  getDoctorAvailability,
  getMyAvailability,
  createMyAvailability,
  updateMyAvailability,
  deleteMyAvailability
} from '../controllers/doctor.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.get('/:id/availability', getDoctorAvailability);

// Authenticated doctor routes - manage own availability
router.get('/availability/me', requireAuth, getMyAvailability);
router.post('/availability', requireAuth, createMyAvailability);
router.put('/availability/:id', requireAuth, updateMyAvailability);
router.delete('/availability/:id', requireAuth, deleteMyAvailability);

export default router;

