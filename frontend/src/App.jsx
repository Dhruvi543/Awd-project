import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserRole } from './common/enums/enumConstant';

// Layout Components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';
import AdminLayout from './components/layout/AdminLayout';
import PatientLayout from './components/layout/PatientLayout';
import DoctorLayout from './components/layout/DoctorLayout';

// Auth Pages
import AdminLogin from './pages/Admin/AdminLogin';
import Auth from './pages/auth/Auth';

import LandingPage from './pages/LandingPage';

// Main Pages
import Home from './pages/Home/Home';

// Doctor Pages
import DoctorDashboard from './pages/Doctor/Dashboard';
import DoctorAppointments from './pages/Doctor/Appointments';
import DoctorReviews from './pages/Doctor/Reviews';
import DoctorAvailability from './pages/Doctor/Availability';
import DoctorCalendar from './pages/Doctor/Calendar';
import DoctorProfile from './pages/Doctor/Profile';
import DoctorSettings from './pages/Doctor/Settings';
import DoctorNotifications from './pages/Doctor/Notifications';
import DoctorEarnings from './pages/Doctor/Earnings';

// Patient Pages
import PatientDashboard from './pages/Patient/Dashboard';
import PatientAppointments from './pages/Patient/Appointments';
import FindDoctor from './pages/Patient/FindDoctor';
import PatientReviews from './pages/Patient/Reviews';
import PatientAvailability from './pages/Patient/Availability';
import PatientSettings from './pages/Patient/Settings';
import BookAppointment from './pages/Patient/BookAppointment';
import PatientProfile from './pages/Patient/Profile';
import PatientNotifications from './pages/Patient/Notifications';
import PaymentHistory from './pages/Patient/PaymentHistory';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminDoctors from './pages/Admin/Doctors';
import AdminPatients from './pages/Admin/Patients';
import AdminUsers from './pages/Admin/Users';
import AdminAppointments from './pages/Admin/Appointments';
import AdminReviews from './pages/Admin/Reviews';
import AdminAvailability from './pages/Admin/Availability';
import AdminAnalytics from './pages/Admin/Analytics';
import AdminSettings from './pages/Admin/Settings';
import AdminNotifications from './pages/Admin/Notifications';
import AdminPayments from './pages/Admin/Payments';
import TermsEditor from './pages/Admin/TermsEditor';
import PrivacyPolicyEditor from './pages/Admin/PrivacyPolicyEditor';
import CommissionEditor from './pages/Admin/CommissionEditor';
import RevenueDashboard from './pages/Admin/RevenueDashboard';

// Common Pages
import Doctors from './pages/Common/Doctors';
import DoctorDetails from './pages/Common/DoctorDetails';
import TermsAndConditions from './pages/Common/TermsAndConditions';
import PrivacyPolicy from './pages/Common/PrivacyPolicy';
import NotFound from './pages/Common/NotFound';
import Unauthorized from './pages/Common/Unauthorized';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on route
    if (allowedRoles.includes(UserRole.ADMIN)) {
      return <Navigate to="/admin-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    if (allowedRoles.includes(UserRole.ADMIN)) {
      return <Navigate to="/admin-login" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    if (user?.role === UserRole.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === UserRole.DOCTOR) {
      return <Navigate to="/doctor/dashboard" replace />;
    } else if (user?.role === UserRole.PATIENT) {
      return <Navigate to="/patient/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetails />} />
            <Route path="terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
          </Route>

          {/* Protected Routes */}

          {/* Patient Routes */}
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <PatientLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="book-appointment" element={<BookAppointment />} />
            <Route path="payment-history" element={<PaymentHistory />} />
            <Route path="find-doctor" element={<FindDoctor />} />
            <Route path="reviews" element={<PatientReviews />} />
            <Route path="availability" element={<PatientAvailability />} />
            <Route path="notifications" element={<PatientNotifications />} />
            <Route path="settings" element={<PatientSettings />} />
          </Route>

          {/* Doctor Routes */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <DoctorLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="earnings" element={<DoctorEarnings />} />
            <Route path="reviews" element={<DoctorReviews />} />
            <Route path="availability" element={<DoctorAvailability />} />
            <Route path="calendar" element={<DoctorCalendar />} />
            <Route path="notifications" element={<DoctorNotifications />} />
            <Route path="profile" element={<DoctorProfile />} />
            <Route path="settings" element={<DoctorSettings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="availability" element={<AdminAvailability />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="terms" element={<TermsEditor />} />
            <Route path="privacy-policy" element={<PrivacyPolicyEditor />} />
            <Route path="commission" element={<CommissionEditor />} />
            <Route path="revenue" element={<RevenueDashboard />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Error Pages */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;