import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';

const DoctorAppointments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('filter') || searchParams.get('status') || 'all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAppointment, setRejectingAppointment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState(null);
  const [prescription, setPrescription] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    upcoming: 0
  });

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    // Read filter from URL params on mount or when URL changes
    const urlFilter = searchParams.get('filter') || searchParams.get('status');
    const urlSearch = searchParams.get('search') || '';
    if (urlFilter && urlFilter !== filter) {
      setFilter(urlFilter);
    }
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAppointments();
  }, [filter, searchTerm]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const params = {};
      
      // Apply filters
      if (filter === 'upcoming') {
        params.filter = 'upcoming';
      } else if (filter === 'past') {
        params.filter = 'past';
      } else if (filter === 'confirmed' || filter === 'scheduled') {
        params.status = 'confirmed';
      } else if (filter === 'pending') {
        params.status = 'pending';
      } else if (filter === 'cancelled') {
        params.status = 'cancelled';
      } else if (filter !== 'all') {
        params.status = filter;
      }
      
      // Add search term if provided
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await apiService.getAppointments(params);
      if (response.data.success) {
        const appointmentsData = response.data.data || [];
        setAppointments(appointmentsData);
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        const statsData = {
          total: appointmentsData.length,
          pending: appointmentsData.filter(apt => apt.status === 'pending').length,
          confirmed: appointmentsData.filter(apt => apt.status === 'confirmed').length,
          completed: appointmentsData.filter(apt => apt.status === 'completed').length,
          cancelled: appointmentsData.filter(apt => apt.status === 'cancelled').length,
          today: appointmentsData.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= today && aptDate <= todayEnd;
          }).length,
          upcoming: appointmentsData.filter(apt => new Date(apt.appointmentDate) >= new Date() && apt.status !== 'cancelled').length
        };
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      const response = await apiService.confirmAppointment(appointmentId);
      if (response.data.success) {
        alert('Appointment confirmed successfully!');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert(error.response?.data?.message || 'Failed to confirm appointment. Please try again.');
    }
  };

  const handleRejectAppointment = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      const response = await apiService.rejectAppointment(rejectingAppointment._id, rejectionReason);
      if (response.data.success) {
        alert('Appointment rejected successfully!');
        setShowRejectModal(false);
        setRejectingAppointment(null);
        setRejectionReason('');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert(error.response?.data?.message || 'Failed to reject appointment. Please try again.');
    }
  };

  const handleCompleteAppointment = async () => {
    try {
      const response = await apiService.completeAppointment(completingAppointment._id, prescription);
      if (response.data.success) {
        alert('Appointment completed successfully!');
        setShowCompleteModal(false);
        setCompletingAppointment(null);
        setPrescription('');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert(error.response?.data?.message || 'Failed to complete appointment. Please try again.');
    }
  };

  const openRejectModal = (appointment) => {
    setRejectingAppointment(appointment);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const openCompleteModal = (appointment) => {
    setCompletingAppointment(appointment);
    setPrescription(appointment.prescription || '');
    setShowCompleteModal(true);
  };

  const openViewModal = (appointment) => {
    setViewingAppointment(appointment);
    setShowViewModal(true);
  };

  const openCancelModal = (appointment) => {
    setCancellingAppointment(appointment);
    setCancellationReason('');
    setShowCancelModal(true);
  };

  const handleCancelConfirmedAppointment = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }
    
    try {
      const response = await apiService.cancelConfirmedAppointment(cancellingAppointment._id, cancellationReason);
      if (response.data.success) {
        alert('Appointment cancelled successfully!');
        setShowCancelModal(false);
        setCancellingAppointment(null);
        setCancellationReason('');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(error.response?.data?.message || 'Failed to cancel appointment. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
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

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      scheduled: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return statusClasses[status] || statusClasses.pending;
  };

  const isUpcoming = (appointmentDate) => {
    return new Date(appointmentDate) >= new Date();
  };

  const isToday = (appointmentDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const aptDate = new Date(appointmentDate);
    return aptDate >= today && aptDate <= todayEnd;
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Appointments</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all your appointments</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Today</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.today}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Upcoming</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.upcoming}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'past', label: 'Past' },
              { value: 'confirmed', label: 'Confirmed / Scheduled' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'pending', label: 'Pending' }
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => {
                  setFilter(filterOption.value);
                  // Update URL params
                  setSearchParams({ filter: filterOption.value });
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === filterOption.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading appointments...</div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow ${
                  isToday(appointment.appointmentDate) ? 'border-l-4 border-l-indigo-500' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {appointment.patient?.name || appointment.patientName || 'This patient is no longer available'}
                        </h3>
                        {appointment.patient?.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.patient.email}</p>
                        )}
                        {appointment.patient?.phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.patient.phone}</p>
                        )}
                      </div>
                      {/* Show only one status badge - prioritize actual status over time-based labels */}
                      {appointment.status === 'cancelled' ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                          Cancelled
                        </span>
                      ) : appointment.status === 'completed' ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                          Completed
                        </span>
                      ) : isToday(appointment.appointmentDate) && appointment.status !== 'cancelled' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                          Today
                        </span>
                      ) : isUpcoming(appointment.appointmentDate) && !isToday(appointment.appointmentDate) && appointment.status === 'confirmed' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          Upcoming
                        </span>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                          {appointment.status === 'confirmed' ? 'Scheduled' : appointment.status}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(appointment.appointmentDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </p>
                      {appointment.consultationNotes && (
                        <p className="mt-2 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <strong>Notes:</strong> {appointment.consultationNotes}
                        </p>
                      )}
                      {appointment.rejectionReason && (
                        <p className="mt-2 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-800 dark:text-red-400">
                          <strong>Rejection Reason:</strong> {appointment.rejectionReason}
                        </p>
                      )}
                      {appointment.prescription && (
                        <p className="mt-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-800 dark:text-blue-400">
                          <strong>Prescription:</strong> {appointment.prescription}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* View button for all appointments */}
                    <button
                      onClick={() => openViewModal(appointment)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    
                    {appointment.status === 'pending' && (
                      <>
                        {appointment.patient ? (
                          <>
                            <button
                              onClick={() => handleConfirmAppointment(appointment._id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(appointment)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center gap-2 opacity-60">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Patient Deleted
                          </span>
                        )}
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <>
                        {appointment.patient ? (
                          <>
                            <button
                              onClick={() => openCompleteModal(appointment)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Mark Complete
                            </button>
                            <button
                              onClick={() => openCancelModal(appointment)}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <span className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center gap-2 opacity-60">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Patient Deleted
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 border border-gray-200 dark:border-gray-700 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">No appointments found</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && rejectingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reject Appointment</h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingAppointment(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Patient:</strong> {rejectingAppointment.patient?.name || 'This patient is no longer available'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Date:</strong> {formatDate(rejectingAppointment.appointmentDate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Time:</strong> {formatTime(rejectingAppointment.startTime)} - {formatTime(rejectingAppointment.endTime)}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Please provide a reason for rejecting this appointment..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRejectAppointment}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Reject Appointment
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingAppointment(null);
                    setRejectionReason('');
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && completingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Appointment</h2>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setCompletingAppointment(null);
                    setPrescription('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Patient:</strong> {completingAppointment.patient?.name || 'This patient is no longer available'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Date:</strong> {formatDate(completingAppointment.appointmentDate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Time:</strong> {formatTime(completingAppointment.startTime)} - {formatTime(completingAppointment.endTime)}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prescription (Optional)
                </label>
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Add prescription notes if any..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCompleteAppointment}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setCompletingAppointment(null);
                    setPrescription('');
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingAppointment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Patient Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Patient Information</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Name:</strong> {viewingAppointment.patient?.name || 'This patient is no longer available'}
                    </p>
                    {viewingAppointment.patient?.email && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Email:</strong> {viewingAppointment.patient.email}
                      </p>
                    )}
                    {viewingAppointment.patient?.phone && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Phone:</strong> {viewingAppointment.patient.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Appointment Details</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Date:</strong> {formatDate(viewingAppointment.appointmentDate)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Time:</strong> {formatTime(viewingAppointment.startTime)} - {formatTime(viewingAppointment.endTime)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Status:</strong> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(viewingAppointment.status)}`}>
                        {viewingAppointment.status === 'confirmed' ? 'Scheduled' : viewingAppointment.status}
                      </span>
                    </p>
                    {viewingAppointment.consultationNotes && (
                      <div className="mt-3">
                        <strong className="text-gray-700 dark:text-gray-300">Consultation Notes:</strong>
                        <p className="text-gray-700 dark:text-gray-300 mt-1 bg-white dark:bg-gray-800 p-3 rounded-lg">
                          {viewingAppointment.consultationNotes}
                        </p>
                      </div>
                    )}
                    {viewingAppointment.rejectionReason && (
                      <div className="mt-3">
                        <strong className="text-red-700 dark:text-red-400">Rejection/Cancellation Reason:</strong>
                        <p className="text-red-700 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                          {viewingAppointment.rejectionReason}
                        </p>
                      </div>
                    )}
                    {viewingAppointment.prescription && (
                      <div className="mt-3">
                        <strong className="text-blue-700 dark:text-blue-400">Prescription:</strong>
                        <p className="text-blue-700 dark:text-blue-400 mt-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          {viewingAppointment.prescription}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Timestamps</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <strong>Created:</strong> {new Date(viewingAppointment.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <strong>Last Updated:</strong> {new Date(viewingAppointment.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingAppointment(null);
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmed Appointment Modal */}
      {showCancelModal && cancellingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cancel Appointment</h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingAppointment(null);
                    setCancellationReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Patient:</strong> {cancellingAppointment.patient?.name || 'This patient is no longer available'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Date:</strong> {formatDate(cancellingAppointment.appointmentDate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Time:</strong> {formatTime(cancellingAppointment.startTime)} - {formatTime(cancellingAppointment.endTime)}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Please provide a reason for cancelling this confirmed appointment (e.g., emergency, schedule conflict, etc.)..."
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This reason will be sent to the patient via notification.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelConfirmedAppointment}
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Cancel Appointment
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingAppointment(null);
                    setCancellationReason('');
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
