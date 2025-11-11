import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/apiService';

const DoctorCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  // Refresh data when window gains focus (e.g., returning from availability page)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [appointmentsRes, availabilityRes] = await Promise.all([
        apiService.getAppointments(),
        apiService.getMyAvailability()
      ]);
      
      if (appointmentsRes.data.success) {
        setAppointments(appointmentsRes.data.data || []);
      }
      
      if (availabilityRes.data.success) {
        setAvailability(availabilityRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
      return aptDate === dateStr;
    });
  };

  const getAvailabilityForDate = (date) => {
    if (!date) return { schedule: [], leaves: [] };
    const dateStr = date.toISOString().split('T')[0];
    
    // Get availability for this specific date (date-based, not dayOfWeek)
    const daySchedule = availability.filter(item => {
      if (item.type !== 'schedule' || !item.isActive) return false;
      if (!item.startDate) return false;
      const scheduleDate = new Date(item.startDate).toISOString().split('T')[0];
      return scheduleDate === dateStr;
    });
    
    // Get leaves for this date
    const dayLeaves = availability.filter(item => {
      if (item.type !== 'leave' || !item.isActive) return false;
      if (!item.startDate || !item.endDate) return false;
      const startDate = new Date(item.startDate).toISOString().split('T')[0];
      const endDate = new Date(item.endDate).toISOString().split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
    
    return {
      schedule: daySchedule,
      leaves: dayLeaves
    };
  };

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
      setSelectedAppointments(getAppointmentsForDate(date));
      const avail = getAvailabilityForDate(date);
      setSelectedAvailability(avail);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || colors.pending;
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek] || '';
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Calendar View</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            View your appointments, availability, and leaves in one place
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Appointment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Today</span>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2">Loading calendar data...</p>
              </div>
            )}

            {/* Calendar Grid */}
            {!isLoading && (
              <div className="grid grid-cols-7 gap-2">
                {/* Day Names */}
                {dayNames.map((day) => (
                  <div key={day} className="text-center font-bold text-gray-700 dark:text-gray-300 py-3 text-sm">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="min-h-[100px]"></div>;
                }

                const dateAppointments = getAppointmentsForDate(date);
                const dateAvailability = getAvailabilityForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                const hasSchedule = dateAvailability.schedule.length > 0;
                const hasLeave = dateAvailability.leaves.length > 0;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`min-h-[100px] p-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : isToday
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10'
                        : hasLeave
                        ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/10'
                        : hasSchedule
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`text-sm font-bold mb-1 ${
                      isToday ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    {/* Leave indicator - Show first, as it takes priority */}
                    {hasLeave && (
                      <div className="text-xs px-1.5 py-0.5 bg-purple-500 text-white rounded mb-2 truncate font-semibold">
                        🚫 Leave
                      </div>
                    )}
                    
                    {/* Availability indicators - Show only if not on leave */}
                    {hasSchedule && !hasLeave && (
                      <div className="space-y-1 mb-2">
                        {dateAvailability.schedule.slice(0, 2).map((schedule, idx) => (
                          <div
                            key={idx}
                            className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded truncate font-medium"
                            title={`Available: ${schedule.startTime} - ${schedule.endTime}`}
                          >
                            ✓ {schedule.startTime} - {schedule.endTime}
                          </div>
                        ))}
                        {dateAvailability.schedule.length > 2 && (
                          <div className="text-xs px-1.5 py-0.5 bg-blue-400 text-white rounded truncate">
                            +{dateAvailability.schedule.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Appointments */}
                    {dateAppointments.length > 0 && (
                      <div className="space-y-1">
                        {dateAppointments.slice(0, hasSchedule || hasLeave ? 1 : 2).map((apt) => (
                          <div
                            key={apt._id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${
                              apt.status === 'confirmed'
                                ? 'bg-green-500 text-white'
                                : apt.status === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-500 text-white'
                            }`}
                            title={`${apt.patient?.name || 'Patient'}: ${apt.startTime}`}
                          >
                            {apt.startTime}
                          </div>
                        ))}
                        {dateAppointments.length > (hasSchedule || hasLeave ? 1 : 2) && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                            +{dateAppointments.length - (hasSchedule || hasLeave ? 1 : 2)} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
              </div>
            )}
          </div>

          {/* Selected Date Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedDate ? formatDate(selectedDate) : 'Select a Date'}
            </h2>
            
            {selectedDate ? (
              <div className="space-y-6">
                {/* Availability Schedule */}
                {selectedAvailability.schedule.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Available Hours
                    </h3>
                    <div className="space-y-2">
                      {selectedAvailability.schedule.map((schedule, idx) => (
                        <div
                          key={idx}
                          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                              {schedule.startTime} - {schedule.endTime}
                            </p>
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                              30 min slots
                            </span>
                          </div>
                          {schedule.maxAppointments && (
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Max appointments: {schedule.maxAppointments}
                            </p>
                          )}
                          {schedule.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                              Note: {schedule.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leaves */}
                {selectedAvailability.leaves.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      On Leave
                    </h3>
                    <div className="space-y-2">
                      {selectedAvailability.leaves.map((leave, idx) => {
                        const startDate = new Date(leave.startDate);
                        const endDate = new Date(leave.endDate);
                        const isSameDay = startDate.toDateString() === endDate.toDateString();
                        const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                        
                        return (
                          <div
                            key={idx}
                            className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">🚫</span>
                              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                                {isSameDay 
                                  ? formatDate(startDate)
                                  : `${formatDate(startDate)} - ${formatDate(endDate)}`
                                }
                              </p>
                            </div>
                            {!isSameDay && (
                              <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                                Duration: {daysCount} {daysCount === 1 ? 'day' : 'days'}
                              </p>
                            )}
                            <p className="text-xs text-purple-700 dark:text-purple-300">
                              <span className="font-semibold">Reason:</span> {leave.reason || 'No reason provided'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Appointments */}
                {selectedAppointments.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Appointments ({selectedAppointments.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedAppointments.map((appointment) => (
                        <div
                          key={appointment._id}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {appointment.patient?.name || appointment.patientName || 'Unknown Patient'}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {appointment.startTime} - {appointment.endTime}
                          </p>
                          {appointment.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {selectedAvailability.schedule.length === 0 && selectedAvailability.leaves.length === 0
                      ? 'No appointments or availability on this date'
                      : 'No appointments on this date'}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Click on a date to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCalendar;
