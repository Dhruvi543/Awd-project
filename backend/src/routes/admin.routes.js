import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  // Dashboard
  getDashboardStats,
  getRecentAppointments,
  getRecentUsers,
  // Doctors CRUD
  getAllDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  approveDoctor,
  rejectDoctor,
  // Patients CRUD
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  restoreAccount,
  // Appointments CRUD
  getAllAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  // Reviews CRUD
  getAllReviews,
  getReview,
  deleteReview,
  // Availability CRUD
  getAllAvailability,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  // Analytics
  getAnalytics,
  // Payments
  getAdminPayments,
  getPaymentStats,
  // Settings
  getSettings,
  updateSettings,
  verifyAdminPassword,
  updateAdminEmail,
  updateAdminPassword,
  // Notifications
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication
router.use(requireAuth);

// Check if user is admin
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
});

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/recent-appointments', getRecentAppointments);
router.get('/dashboard/recent-users', getRecentUsers);

// Doctors CRUD routes
router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getDoctor);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.patch('/doctors/:id/approve', approveDoctor);
router.patch('/doctors/:id/reject', rejectDoctor);

// Patients CRUD routes
router.get('/patients', getAllPatients);
router.get('/patients/:id', getPatient);
router.post('/patients', createPatient);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', deletePatient);

// Account Restore
router.patch('/users/:id/restore', restoreAccount);

// Appointments CRUD routes
router.get('/appointments', getAllAppointments);
router.get('/appointments/:id', getAppointment);
router.put('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', deleteAppointment);

// Reviews CRUD routes
router.get('/reviews', getAllReviews);
router.get('/reviews/:id', getReview);
router.delete('/reviews/:id', deleteReview);

// Availability CRUD routes
router.get('/availability', getAllAvailability);
router.get('/availability/:id', getAvailability);
router.post('/availability', createAvailability);
router.put('/availability/:id', updateAvailability);
router.delete('/availability/:id', deleteAvailability);

// Analytics routes
router.get('/analytics', getAnalytics);

// Payment routes
router.get('/payments', getAdminPayments);
router.get('/payments/stats', getPaymentStats);

  // Settings routes
  router.get('/settings', getSettings);
  router.put('/settings', updateSettings);
  router.post('/settings/verify-password', verifyAdminPassword);
  router.put('/settings/email', updateAdminEmail);
  router.put('/settings/password', updateAdminPassword);

  // Notifications routes
  router.get('/notifications', getNotifications);
  router.patch('/notifications/:id/read', markNotificationRead);
  router.patch('/notifications/read-all', markAllNotificationsRead);
  router.delete('/notifications/:id', deleteNotification);

  export default router;
