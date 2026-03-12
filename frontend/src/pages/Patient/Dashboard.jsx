import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../api/apiService';
import ProfileCompletionPrompt from '../../components/auth/ProfileCompletionPrompt';

const PatientDashboard = () => {
  const { user, getCurrentUser } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [dismissProfileBanner, setDismissProfileBanner] = useState(false);

  // Check if profile needs completion
  const needsProfileCompletion = user?.authProvider === 'google' && user?.profileComplete === false;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all appointments for total count
      const allAppointmentsResponse = await apiService.getAppointments();
      const total = allAppointmentsResponse.data.success ? (allAppointmentsResponse.data.data || []).length : 0;
      
      // Fetch filtered appointments using database queries
      const [pendingResponse, completedResponse, upcomingResponse] = await Promise.all([
        apiService.getAppointments({ status: 'pending' }),
        apiService.getAppointments({ status: 'completed' }),
        apiService.getAppointments({ status: 'confirmed', filter: 'upcoming' })
      ]);
      
      const pendingCount = pendingResponse.data.success ? (pendingResponse.data.data || []).length : 0;
      const completedCount = completedResponse.data.success ? (completedResponse.data.data || []).length : 0;
      
      // Calculate upcoming count (confirmed and future date)
      let upcomingCount = 0;
      let upcomingList = [];
      if (upcomingResponse.data.success) {
        const upcoming = upcomingResponse.data.data || [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        upcomingList = upcoming
          .filter(apt => apt.status === 'confirmed' && new Date(apt.appointmentDate) >= now)
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
          .slice(0, 3);
        
        upcomingCount = upcoming.filter(apt => 
          apt.status === 'confirmed' && new Date(apt.appointmentDate) >= now
        ).length;
      }
      
      setStats({
        totalAppointments: total,
        upcomingAppointments: upcomingCount,
        completedAppointments: completedCount,
        pendingAppointments: pendingCount,
      });
      
      setUpcomingAppointments(upcomingList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, link }) => {
    const IconComponent = icon;
    return (
      <Link
        to={link || '#'}
        className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
        </div>
      </Link>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleProfileComplete = async () => {
    await getCurrentUser();
    setShowProfilePrompt(false);
  };

  return (
    <div className="w-full max-w-full">
      <div className="max-w-full">
        {/* Profile Completion Prompt Modal */}
        {showProfilePrompt && needsProfileCompletion && (
          <ProfileCompletionPrompt 
            onClose={() => setShowProfilePrompt(false)}
            onComplete={handleProfileComplete}
          />
        )}

        {/* Profile Completion Banner */}
        {needsProfileCompletion && !dismissProfileBanner && !showProfilePrompt && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Complete your profile for a better experience
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Add your phone number, address, and other details to help us serve you better.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfilePrompt(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Complete Profile
              </button>
              <button
                onClick={() => setDismissProfileBanner(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                aria-label="Dismiss"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name || 'Patient'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's an overview of your health appointments and activities.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            color="bg-blue-500"
            link="/patient/appointments"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            color="bg-green-500"
            link="/patient/appointments?status=upcoming"
          />
          <StatCard
            title="Pending"
            value={stats.pendingAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            color="bg-yellow-500"
            link="/patient/appointments?status=pending"
          />
          <StatCard
            title="Completed"
            value={stats.completedAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            color="bg-teal-500"
            link="/patient/appointments?status=completed"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/patient/find-doctor"
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-blue-700 dark:text-blue-300">Find Doctor</span>
            </Link>
            <Link
              to="/patient/appointments"
              className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium text-green-700 dark:text-green-300">My Appointments</span>
            </Link>
            <Link
              to="/patient/reviews"
              className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="font-medium text-purple-700 dark:text-purple-300">Reviews</span>
            </Link>
            <Link
              to="/patient/notifications"
              className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-medium text-orange-700 dark:text-orange-300">Notifications</span>
            </Link>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Appointments</h2>
            <Link
              to="/patient/appointments"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              View All
            </Link>
          </div>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Dr. {appointment.doctor?.name || appointment.doctorName || 'This doctor is no longer available'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(appointment.appointmentDate)} at {appointment.startTime} - {appointment.endTime}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No upcoming appointments. <Link to="/patient/find-doctor" className="text-blue-600 dark:text-blue-400 hover:underline">Book one now!</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
