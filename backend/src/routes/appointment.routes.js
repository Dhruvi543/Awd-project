import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPatientAppointments,
  bookAppointment,
  cancelAppointment,
  updatePatientAppointment,
  deletePatientAppointment
} from '../controllers/appointment.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Patient appointment routes
router.get('/', getPatientAppointments);
router.post('/', bookAppointment);
router.put('/:id', updatePatientAppointment);
router.delete('/:id', deletePatientAppointment);
router.patch('/:id/cancel', cancelAppointment);

export default router;

