import express from 'express';
import {
  getDoctors,
  getDoctor,
  getDoctorAvailability
} from '../controllers/doctor.controller.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.get('/:id/availability', getDoctorAvailability);

export default router;

