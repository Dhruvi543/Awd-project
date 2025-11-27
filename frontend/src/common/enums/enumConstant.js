export const RoutePath = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Main app routes
  HOME: '/',
  DASHBOARD: '/dashboard',
  
  // Patient routes
  APPOINTMENTS: '/appointments',
  BOOK_APPOINTMENT: '/book-appointment',
  MY_PROFILE: '/profile',
  
  // Doctor routes
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_APPOINTMENTS: '/doctor/appointments',
  DOCTOR_AVAILABILITY: '/doctor/availability',
  DOCTOR_PROFILE: '/doctor/profile',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_DOCTORS: '/admin/doctors',
  ADMIN_USERS: '/admin/users',
  ADMIN_PATIENTS: '/admin/patients',
  ADMIN_APPOINTMENTS: '/admin/appointments',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_AVAILABILITY: '/admin/availability',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Common routes
  DOCTORS: '/doctors',
  DOCTOR_DETAILS: '/doctors/:id',
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
};

export const UserRole = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
};

export const AppointmentStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const NotificationType = {
  APPOINTMENT_BOOKED: 'appointment_booked',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  PROFILE_UPDATE: 'profile_update',
  DOCTOR_APPROVED: 'doctor_approved',
};

export const ApiEndpoints = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  
  // User endpoints
  GET_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  CHANGE_PASSWORD: '/api/users/change-password',
  
  // Doctor endpoints
  GET_DOCTORS: '/api/doctors',
  GET_DOCTOR: '/api/doctors/:id',
  UPDATE_DOCTOR_PROFILE: '/api/doctors/profile',
  GET_DOCTOR_AVAILABILITY: '/api/doctors/:id/availability',
  UPDATE_DOCTOR_AVAILABILITY: '/api/doctors/availability',
  
  // Appointment endpoints
  GET_APPOINTMENTS: '/api/appointments',
  BOOK_APPOINTMENT: '/api/appointments',
  CANCEL_APPOINTMENT: '/api/appointments/:id/cancel',
  CONFIRM_APPOINTMENT: '/api/appointments/:id/confirm',
  COMPLETE_APPOINTMENT: '/api/appointments/:id/complete',
  
  // Notification endpoints
  GET_NOTIFICATIONS: '/api/notifications',
  MARK_NOTIFICATION_READ: '/api/notifications/:id/read',
  MARK_ALL_NOTIFICATIONS_READ: '/api/notifications/read-all',
  DELETE_NOTIFICATION: '/api/notifications/:id',
};

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

export const ResponseStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
  IDLE: 'idle',
};