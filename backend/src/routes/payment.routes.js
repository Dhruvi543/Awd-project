import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { allowRoles } from '../middleware/rbac.js';
import { createOrder, initiateRefund, getPaymentHistory, getDoctorEarnings } from '../controllers/payment.controller.js';

const router = express.Router();

// All payment routes require authentication
router.use(requireAuth);

// Create order — patient only
router.post('/create-order', allowRoles('patient'), createOrder);

// Payment history — patient only
router.get('/history', allowRoles('patient'), getPaymentHistory);

// Doctor earnings — doctor only
router.get('/doctor-earnings', allowRoles('doctor'), getDoctorEarnings);

// Refund — patient, doctor, or admin can initiate
router.post('/refund/:appointmentId', allowRoles('patient', 'doctor', 'admin'), initiateRefund);

export default router;

