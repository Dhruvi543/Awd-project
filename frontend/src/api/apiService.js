import axios from 'axios';

// Use relative URLs since Vite proxy handles /api -> http://localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only clear and redirect if:
      // 1. Not already on login/register page
      // 2. The error is actually an authentication error (not a network error)
      // 3. We have a token stored (meaning we were authenticated)
      const currentPath = window.location.pathname;
      // We no longer store the token in localStorage, we rely on the user object to indicate authenticated state
      const hasUserSession = localStorage.getItem('user');
      
      // Only clear if we have a user session and we're not on auth pages
      // This prevents clearing on initial page load or network errors
      if (hasUserSession && 
          !currentPath.includes('/login') && 
          !currentPath.includes('/register') && 
          !currentPath.includes('/admin-login') &&
          error.response?.data?.message !== 'Invalid credentials') {
        // Check if this is a real auth failure (not just a network issue)
        // Only clear if the error message indicates authentication failure
        const errorMessage = error.response?.data?.message || '';
        const isAuthError = errorMessage.includes('token') || 
                           errorMessage.includes('unauthorized') || 
                           errorMessage.includes('authentication') ||
                           errorMessage.includes('expired');
        
        if (isAuthError) {
          localStorage.removeItem('user');
          // Use a small delay to prevent race conditions
          setTimeout(() => {
            if (currentPath.includes('/admin')) {
              window.location.href = '/admin-login';
            } else {
              window.location.href = '/login';
            }
          }, 100);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Generic request methods
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  // Auth methods
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  logout: () => apiClient.post('/api/auth/logout'),
  refreshToken: () => apiClient.post('/api/auth/refresh'),
  googleLogin: (credential) => apiClient.post('/api/auth/google', { credential }),
  
  // User methods
  getProfile: () => apiClient.get('/api/users/profile'),
  updateProfile: (userData) => apiClient.put('/api/users/profile', userData),
  changePassword: (passwordData) => apiClient.post('/api/users/change-password', passwordData),
  deleteAccount: () => apiClient.delete('/api/users/account'),
  
  // Doctor methods
  getDoctors: (params = {}) => apiClient.get('/api/doctors', { params }),
  getDoctor: (id) => apiClient.get(`/api/doctors/${id}`),
  updateDoctorProfile: (doctorData) => apiClient.put('/api/doctors/profile', doctorData),
  getDoctorAvailability: (id) => apiClient.get(`/api/doctors/${id}/availability`),
  // Doctor's own availability management
  getMyAvailability: () => apiClient.get('/api/doctors/availability/me'),
  createMyAvailability: (availabilityData) => apiClient.post('/api/doctors/availability', availabilityData),
  updateMyAvailability: (id, availabilityData) => apiClient.put(`/api/doctors/availability/${id}`, availabilityData),
  deleteMyAvailability: (id) => apiClient.delete(`/api/doctors/availability/${id}`),
  generateMonthlyAvailability: (monthData) => apiClient.post('/api/doctors/availability/generate-monthly', monthData),
  toggleDateAvailability: (dateData) => apiClient.post('/api/doctors/availability/toggle-date', dateData),
  
  // Appointment methods
  getAppointments: (params = {}) => apiClient.get('/api/appointments', { params }),
  bookAppointment: (appointmentData) => apiClient.post('/api/appointments', appointmentData),
  updateAppointment: (id, appointmentData) => apiClient.put(`/api/appointments/${id}`, appointmentData),
  deleteAppointment: (id) => apiClient.delete(`/api/appointments/${id}`),
  cancelAppointment: (id) => apiClient.patch(`/api/appointments/${id}/cancel`),
  confirmAppointment: (id) => apiClient.patch(`/api/appointments/${id}/confirm`),
  rejectAppointment: (id, rejectionReason) => apiClient.patch(`/api/appointments/${id}/reject`, { rejectionReason }),
  cancelConfirmedAppointment: (id, cancellationReason) => apiClient.patch(`/api/appointments/${id}/cancel-confirmed`, { cancellationReason }),
  completeAppointment: (id, prescription) => apiClient.patch(`/api/appointments/${id}/complete`, { prescription }),

  // Payment methods
  createPaymentOrder: (data) => apiClient.post('/api/payment/create-order', data),
  getPaymentHistory: () => apiClient.get('/api/payment/history'),
  getDoctorEarnings: () => apiClient.get('/api/payment/doctor-earnings'),
  
  // Notification methods
  getNotifications: () => apiClient.get('/api/notifications'),
  markNotificationRead: (id) => apiClient.patch(`/api/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch('/api/notifications/read-all'),
  deleteNotification: (id) => apiClient.delete(`/api/notifications/${id}`),
  
  // Review methods
  getDoctorReviews: (doctorId) => apiClient.get(`/api/reviews/doctor/${doctorId}`),
  getPatientReviews: () => apiClient.get('/api/reviews/patient'),
  createReview: (reviewData) => apiClient.post('/api/reviews', reviewData),
  updateReview: (id, reviewData) => apiClient.put(`/api/reviews/${id}`, reviewData),
  deleteReview: (id) => apiClient.delete(`/api/reviews/${id}`),
  
  // Admin methods - Dashboard
  getAdminStats: () => apiClient.get('/api/admin/dashboard/stats'),
  getRecentAppointments: (limit = 5) => apiClient.get(`/api/admin/dashboard/recent-appointments?limit=${limit}`),
  getRecentUsers: (limit = 5) => apiClient.get(`/api/admin/dashboard/recent-users?limit=${limit}`),
  
  // Admin methods - Doctors CRUD
  getAllDoctors: (params = {}) => apiClient.get('/api/admin/doctors', { params }),
  getDoctorAdmin: (id) => apiClient.get(`/api/admin/doctors/${id}`),
  createDoctor: (doctorData) => apiClient.post('/api/admin/doctors', doctorData),
  updateDoctor: (id, doctorData) => apiClient.put(`/api/admin/doctors/${id}`, doctorData),
  deleteDoctor: (id) => apiClient.delete(`/api/admin/doctors/${id}`),
  restoreDoctor: (id) => apiClient.patch(`/api/admin/users/${id}/restore`),
  approveDoctor: (id) => apiClient.patch(`/api/admin/doctors/${id}/approve`),
  rejectDoctor: (id, rejectionReason) => apiClient.patch(`/api/admin/doctors/${id}/reject`, { rejectionReason }),
  
  // Admin methods - Patients CRUD
  getAllPatients: (params = {}) => apiClient.get('/api/admin/patients', { params }),
  getPatient: (id) => apiClient.get(`/api/admin/patients/${id}`),
  createPatient: (patientData) => apiClient.post('/api/admin/patients', patientData),
  updatePatient: (id, patientData) => apiClient.put(`/api/admin/patients/${id}`, patientData),
  deletePatient: (id) => apiClient.delete(`/api/admin/patients/${id}`),
  restorePatient: (id) => apiClient.patch(`/api/admin/users/${id}/restore`),
  
  // Admin methods - Appointments CRUD
  getAllAppointments: (params = {}) => apiClient.get('/api/admin/appointments', { params }),
  getAppointment: (id) => apiClient.get(`/api/admin/appointments/${id}`),
  updateAppointmentAdmin: (id, appointmentData) => apiClient.put(`/api/admin/appointments/${id}`, appointmentData),
  deleteAppointmentAdmin: (id) => apiClient.delete(`/api/admin/appointments/${id}`),
  
  // Admin methods - Reviews CRUD
  getAllReviews: (params = {}) => apiClient.get('/api/admin/reviews', { params }),
  getReview: (id) => apiClient.get(`/api/admin/reviews/${id}`),
  deleteReviewAdmin: (id) => apiClient.delete(`/api/admin/reviews/${id}`),
  
  // Admin methods - Availability CRUD
  getAllAvailability: (params = {}) => apiClient.get('/api/admin/availability', { params }),
  getAvailability: (id) => apiClient.get(`/api/admin/availability/${id}`),
  createAvailability: (availabilityData) => apiClient.post('/api/admin/availability', availabilityData),
  updateAvailability: (id, availabilityData) => apiClient.put(`/api/admin/availability/${id}`, availabilityData),
  deleteAvailability: (id) => apiClient.delete(`/api/admin/availability/${id}`),
  
  // Admin methods - Analytics
  getAnalytics: (params = {}) => apiClient.get('/api/admin/analytics', { params }),
  
  // Admin methods - Payments
  getAdminPayments: (params = {}) => apiClient.get('/api/admin/payments', { params }),
  getAdminPaymentStats: () => apiClient.get('/api/admin/payments/stats'),
  
  // Admin methods - Settings
  getSettings: () => apiClient.get('/api/settings'),
  updateSettings: (settingsData) => apiClient.put('/api/admin/settings', settingsData),
  verifyAdminPassword: (passwordData) => apiClient.post('/api/admin/settings/verify-password', passwordData),
  updateAdminEmail: (emailData) => apiClient.put('/api/admin/settings/email', emailData),
  updateAdminPassword: (passwordData) => apiClient.put('/api/admin/settings/password', passwordData),
  
  // Admin methods - Notifications
  getNotificationsAdmin: (params = {}) => apiClient.get('/api/admin/notifications', { params }),
  markNotificationReadAdmin: (id) => apiClient.patch(`/api/admin/notifications/${id}/read`),
  markAllNotificationsReadAdmin: () => apiClient.patch('/api/admin/notifications/read-all'),
  deleteNotificationAdmin: (id) => apiClient.delete(`/api/admin/notifications/${id}`),

  // Terms & Conditions methods
  getCurrentTerms: () => apiClient.get('/api/terms/current'),
  getTermsStatus: () => apiClient.get('/api/terms/status'),
  acceptTerms: () => apiClient.post('/api/terms/accept', { accepted: true }),

  // Commission methods
  getCommissionSettings: () => apiClient.get('/api/commission/settings'),
  updateCommissionSettings: (data) => apiClient.put('/api/commission/settings', data),
  getDoctorEarningsDetailed: (params = {}) => apiClient.get('/api/commission/doctor-earnings', { params }),
  getAdminRevenueStats: (params = {}) => apiClient.get('/api/commission/admin-revenue', { params }),
};

export default apiService;