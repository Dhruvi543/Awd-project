import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/apiService';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    todayAppointments: 0,
    totalReviews: 0,
    averageRating: 0,
    thisWeekAppointments: 0,
    thisMonthAppointments: 0,
    upcomingAppointments: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [appointmentsOverTime, setAppointmentsOverTime] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch doctor appointments
      const appointmentsResponse = await apiService.getAppointments();
      if (appointmentsResponse.data.success) {
        const appointments = appointmentsResponse.data.data || [];
        
        const total = appointments.length;
        const pending = appointments.filter(apt => apt.status === 'pending').length;
        const confirmed = appointments.filter(apt => apt.status === 'confirmed').length;
        const completed = appointments.filter(apt => apt.status === 'completed').length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        const todayApts = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= today && aptDate <= todayEnd;
        });
        
        // This week appointments
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const thisWeekApts = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= weekStart && aptDate <= weekEnd;
        });
        
        // This month appointments
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const thisMonthApts = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= monthStart && aptDate <= monthEnd;
        });
        
        setStats(prev => ({
          ...prev,
          totalAppointments: total,
          pendingAppointments: pending,
          confirmedAppointments: confirmed,
          completedAppointments: completed,
          todayAppointments: todayApts.length,
          thisWeekAppointments: thisWeekApts.length,
          thisMonthAppointments: thisMonthApts.length,
        }));

        // Get upcoming appointments (next 5)
        const upcoming = appointments
          .filter(apt => (apt.status === 'confirmed' || apt.status === 'pending') && new Date(apt.appointmentDate) >= new Date())
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
          .slice(0, 5);
        
        setUpcomingAppointments(upcoming);
        
        // Calculate upcoming appointments count
        const upcomingCount = appointments.filter(apt => 
          new Date(apt.appointmentDate) >= new Date() && 
          apt.status !== 'cancelled' && 
          apt.status !== 'completed'
        ).length;
        
        setStats(prev => ({
          ...prev,
          upcomingAppointments: upcomingCount
        }));
        
        // Get today's appointments
        const todayAptsList = appointments
          .filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate.toDateString() === today.toDateString() && 
                   (apt.status === 'confirmed' || apt.status === 'pending');
          })
          .sort((a, b) => {
            const timeA = a.startTime.split(':').map(Number);
            const timeB = b.startTime.split(':').map(Number);
            return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
          });
        
        setTodayAppointments(todayAptsList);
        
        // Calculate appointments over time (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const dateEnd = new Date(date);
          dateEnd.setHours(23, 59, 59, 999);
          
          const count = appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= date && aptDate <= dateEnd;
          }).length;
          
          last7Days.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count
          });
        }
        setAppointmentsOverTime(last7Days);
      }
      
      // Fetch reviews
      // User object is normalized in AuthContext to always have _id
      const doctorId = user?._id;
      if (doctorId) {
        try {
          const reviewsResponse = await apiService.getDoctorReviews(doctorId);
          if (reviewsResponse.data.success) {
            const reviews = reviewsResponse.data.reviews || reviewsResponse.data.data || [];
            const totalReviews = reviewsResponse.data.totalReviews || reviews.length;
            const avgRating = reviewsResponse.data.averageRating 
              ? parseFloat(reviewsResponse.data.averageRating)
              : (reviews.length > 0
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                : 0);
            
            setStats(prev => ({
              ...prev,
              totalReviews,
              averageRating: parseFloat(avgRating.toFixed(1)),
            }));
            
            // Get recent reviews (last 3)
            const recent = reviews
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 3);
            setRecentReviews(recent);
          }
        } catch (error) {
          console.error('Error fetching reviews:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, link, subtitle }) => {
    const IconComponent = icon;
    // Check if value is a number or numeric string (like "4.5/5")
    const isNumeric = typeof value === 'number' || (typeof value === 'string' && /^[\d./]+$/.test(value));
    const valueClassName = isNumeric 
      ? "text-3xl font-bold text-gray-900 dark:text-white" 
      : "text-lg font-semibold text-gray-700 dark:text-gray-300";
    
    return (
      <Link
        to={link || '#'}
        className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <p className={valueClassName}>{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color} flex-shrink-0`}>
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

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      if (action === 'confirm') {
        await apiService.confirmAppointment(appointmentId);
      } else if (action === 'reject') {
        await apiService.cancelAppointment(appointmentId);
      } else if (action === 'complete') {
        await apiService.completeAppointment(appointmentId);
      }
      fetchDashboardData();
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      alert(`Failed to ${action} appointment. Please try again.`);
    }
  };

  // Simple Bar Chart Component
  const SimpleBarChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      );
    }
    
    const maxValue = Math.max(...data.map(d => d.count || 0), 1);
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? ((item.count || 0) / maxValue) * 100 : 0;
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">{item.date}</span>
                <span className="text-gray-600 dark:text-gray-400 font-semibold">{item.count || 0}</span>
              </div>
              <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${percentage}%` }}
                >
                  {item.count > 0 && (
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-full">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, Dr. {user?.name || 'Doctor'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's an overview of your practice and schedule.
          </p>
        </div>

        {/* Primary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            color="bg-blue-500"
            link="/doctor/appointments"
          />
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            color="bg-indigo-500"
            link="/doctor/appointments?filter=today"
          />
          <StatCard
            title="Average Rating"
            value={stats.totalReviews > 0 ? `${stats.averageRating}/5` : 'No reviews'}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
            color="bg-yellow-500"
            link="/doctor/reviews"
            subtitle={stats.totalReviews > 0 ? `${stats.totalReviews} reviews` : 'Start getting reviews'}
          />
          <StatCard
            title="Pending"
            value={stats.pendingAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            color="bg-orange-500"
            link="/doctor/appointments?filter=pending"
          />
        </div>

        {/* Secondary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Confirmed"
            value={stats.confirmedAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            color="bg-green-500"
            link="/doctor/appointments?filter=confirmed"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
            color="bg-teal-500"
            link="/doctor/appointments?filter=upcoming"
          />
          <StatCard
            title="This Month"
            value={stats.thisMonthAppointments}
            icon={() => (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            color="bg-purple-500"
            link="/doctor/appointments"
            subtitle={`${stats.thisWeekAppointments} this week`}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/doctor/appointments"
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium text-blue-700 dark:text-blue-300">View Appointments</span>
            </Link>
            <Link
              to="/doctor/availability"
              className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-green-700 dark:text-green-300">Manage Availability</span>
            </Link>
            <Link
              to="/doctor/reviews"
              className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="font-medium text-yellow-700 dark:text-yellow-300">View Reviews</span>
            </Link>
            <Link
              to="/doctor/notifications"
              className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-medium text-orange-700 dark:text-orange-300">Notifications</span>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Schedule</h2>
              <Link
                to="/doctor/appointments?filter=today"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-lg text-white">
                        <span className="text-xs font-medium">{formatTime(appointment.startTime).split(' ')[0]}</span>
                        <span className="text-xs">{formatTime(appointment.startTime).split(' ')[1]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {appointment.patient?.name || appointment.patientName || 'This patient is no longer available'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </p>
                        {appointment.consultationNotes && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                            {appointment.consultationNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {appointment.status}
                      </span>
                      {appointment.status === 'pending' && (
                        appointment.patient ? (
                          <button
                            onClick={() => handleAppointmentAction(appointment._id, 'confirm')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm opacity-60">
                            Patient Deleted
                          </span>
                        )
                      )}
                      {appointment.status === 'confirmed' && new Date(appointment.appointmentDate) <= new Date() && (
                        appointment.patient ? (
                          <button
                            onClick={() => handleAppointmentAction(appointment._id, 'complete')}
                            className="px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                          >
                            Complete
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm opacity-60">
                            Patient Deleted
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No appointments scheduled for today</p>
              </div>
            )}
          </div>

          {/* Appointments Over Time Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Last 7 Days</h2>
            <SimpleBarChart data={appointmentsOverTime} />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Appointments</h2>
              <Link
                to="/doctor/appointments?filter=upcoming"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {appointment.patient?.name || appointment.patientName || 'This patient is no longer available'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {appointment.status}
                      </span>
                      {appointment.status === 'pending' && (
                        appointment.patient ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAppointmentAction(appointment._id, 'confirm')}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAppointmentAction(appointment._id, 'reject')}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm opacity-60">
                            Patient Deleted
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No upcoming appointments
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Reviews</h2>
              <Link
                to="/doctor/reviews"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            ) : recentReviews.length > 0 ? (
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div
                    key={review._id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {review.patient?.name || 'This patient is no longer available'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <svg
                            key={rating}
                            className={`w-4 h-4 ${
                              rating <= review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p>No reviews yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
