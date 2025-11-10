import express from 'express';
import {
  getDoctorReviews,
  createReview,
  getPatientReviews,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public route - get reviews for a doctor
router.get('/doctor/:doctorId', getDoctorReviews);

// Protected routes - require authentication
router.use(requireAuth);

// Patient review routes
router.get('/patient', getPatientReviews);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router;

