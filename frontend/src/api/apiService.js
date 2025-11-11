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

// Request interceptor - add token to Authorization header if available
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only clear and redirect if not already on login/register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/admin-login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect based on current path
        if (currentPath.includes('/admin')) {
          window.location.href = '/admin-login';
        } else {
          window.location.href = '/login';
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
  
  // User methods
  getProfile: () => apiClient.get('/api/users/profile'),
  updateProfile: (userData) => apiClient.put('/api/users/profile', userData),
  changePassword: (passwordData) => apiClient.post('/api/users/change-password', passwordData),
  
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
  approveDoctor: (id) => apiClient.patch(`/api/admin/doctors/${id}/approve`),
  rejectDoctor: (id, rejectionReason) => apiClient.patch(`/api/admin/doctors/${id}/reject`, { rejectionReason }),
  
  // Admin methods - Patients CRUD
  getAllPatients: (params = {}) => apiClient.get('/api/admin/patients', { params }),
  getPatient: (id) => apiClient.get(`/api/admin/patients/${id}`),
  createPatient: (patientData) => apiClient.post('/api/admin/patients', patientData),
  updatePatient: (id, patientData) => apiClient.put(`/api/admin/patients/${id}`, patientData),
  deletePatient: (id) => apiClient.delete(`/api/admin/patients/${id}`),
  
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
  
  // Admin methods - System Logs
  getAllLogs: (params = {}) => apiClient.get('/api/admin/logs', { params }),
  createLog: (logData) => apiClient.post('/api/admin/logs', logData),
  deleteLog: (id) => apiClient.delete(`/api/admin/logs/${id}`),
  clearAllLogs: () => apiClient.delete('/api/admin/logs'),
  
  // Admin methods - Settings
  getSettings: () => apiClient.get('/api/admin/settings'),
  updateSettings: (settingsData) => apiClient.put('/api/admin/settings', settingsData),
  verifyAdminPassword: (passwordData) => apiClient.post('/api/admin/settings/verify-password', passwordData),
  updateAdminEmail: (emailData) => apiClient.put('/api/admin/settings/email', emailData),
  updateAdminPassword: (passwordData) => apiClient.put('/api/admin/settings/password', passwordData),
  
  // Admin methods - Notifications
  getNotificationsAdmin: (params = {}) => apiClient.get('/api/admin/notifications', { params }),
  markNotificationReadAdmin: (id) => apiClient.patch(`/api/admin/notifications/${id}/read`),
  markAllNotificationsReadAdmin: () => apiClient.patch('/api/admin/notifications/read-all'),
  deleteNotificationAdmin: (id) => apiClient.delete(`/api/admin/notifications/${id}`),
};

export default apiService;