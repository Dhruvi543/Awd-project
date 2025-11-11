import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { allowRoles } from '../middleware/rbac.js';
import {
  getPatientAppointments,
  getDoctorAppointments,
  bookAppointment,
  cancelAppointment,
  updatePatientAppointment,
  deletePatientAppointment,
  confirmAppointment,
  rejectAppointment,
  cancelConfirmedAppointment,
  completeAppointment
} from '../controllers/appointment.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Patient appointment routes
router.get('/', (req, res, next) => {
  if (req.user.role === 'patient') {
    return getPatientAppointments(req, res, next);
  } else if (req.user.role === 'doctor') {
    return getDoctorAppointments(req, res, next);
  } else {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
});
router.post('/', allowRoles('patient'), bookAppointment);
router.put('/:id', allowRoles('patient'), updatePatientAppointment);
router.delete('/:id', allowRoles('patient'), deletePatientAppointment);
router.patch('/:id/cancel', allowRoles('patient'), cancelAppointment);

// Doctor appointment routes
router.patch('/:id/confirm', allowRoles('doctor'), confirmAppointment);
router.patch('/:id/reject', allowRoles('doctor'), rejectAppointment);
router.patch('/:id/cancel-confirmed', allowRoles('doctor'), cancelConfirmedAppointment);
router.patch('/:id/complete', allowRoles('doctor'), completeAppointment);

export default router;

