import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import DoctorAvailabilityCalendar from '../../components/DoctorAvailabilityCalendar';

const PatientAvailability = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const [availability, setAvailability] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  useEffect(() => {
    fetchDoctors();
    if (doctorId) {
      fetchAvailability(doctorId);
    }
  }, [doctorId]);

  const fetchDoctors = async () => {
    try {
      const response = await apiService.getDoctors();
      if (response.data.success) {
        setDoctors(response.data.data || []);
        if (doctorId) {
          const doctor = response.data.data.find(d => d._id === doctorId);
          setSelectedDoctor(doctor);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailability = async (id) => {
    try {
      setIsLoading(true);
      const response = await apiService.getDoctorAvailability(id);
      if (response.data.success) {
        setAvailability(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    fetchAvailability(doctor._id);
  };

  // Helper function to format date in local timezone (YYYY-MM-DD)
  const formatDateLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is available
  const isDateAvailable = (date) => {
    const dayOfWeek = date.getDay();
    const dateStr = formatDateLocal(date);
    
    // Check for leaves (unavailable dates)
    const isOnLeave = availability.some(slot => {
      if (slot.type === 'leave' && slot.startDate && slot.endDate) {
        const startDate = new Date(slot.startDate);
        const endDate = new Date(slot.endDate);
        const checkDate = new Date(dateStr);
        return checkDate >= startDate && checkDate <= endDate;
      }
      return false;
    });
    
    if (isOnLeave) return false;
    
    // Check for schedule availability
    return availability.some(slot => 
      slot.type === 'schedule' && 
      slot.dayOfWeek === dayOfWeek &&
      slot.isActive
    );
  };

  // Get available time slots for a specific date
  const getAvailableTimeSlots = (date) => {
    const dayOfWeek = date.getDay();
    const dateStr = formatDateLocal(date);
    
    // Check if on leave
    const isOnLeave = availability.some(slot => {
      if (slot.type === 'leave' && slot.startDate && slot.endDate) {
        const startDate = new Date(slot.startDate);
        const endDate = new Date(slot.endDate);
        const checkDate = new Date(dateStr);
        return checkDate >= startDate && checkDate <= endDate;
      }
      return false;
    });
    
    if (isOnLeave) return [];
    
    // Get schedule slots for this day of week
    return availability
      .filter(slot => 
        slot.type === 'schedule' && 
        slot.dayOfWeek === dayOfWeek &&
        slot.isActive &&
        slot.startTime &&
        slot.endTime
      )
      .map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime
      }));
  };

  // Format time to 12-hour format
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Calendar functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];
    const today = new Date();
    const todayStr = formatDateLocal(today);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dateStr = formatDateLocal(date);
      const isToday = dateStr === todayStr;
      const isAvailable = isDateAvailable(date);
      const isPast = date < today;

      days.push({
        date: dateStr,
        day,
        disabled: isPast,
        today: isToday,
        available: isAvailable
      });
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {monthNames[selectedMonth]} {selectedYear}
          </h3>
          <button
            type="button"
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((dayData, index) => {
            if (!dayData) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            return (
              <div
                key={dayData.date}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all
                  ${dayData.disabled 
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600' 
                    : dayData.available
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 font-semibold hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer'
                    : dayData.today
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                <span className="text-base font-medium">{dayData.day}</span>
                {dayData.available && !dayData.disabled && (
                  <span className="text-xs mt-0.5">✓</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-400 dark:border-blue-600 bg-blue-100 dark:bg-blue-900/30"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Today</span>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleList = () => {
    const scheduleSlots = availability.filter(slot => slot.type === 'schedule' && slot.isActive);
    const leaveSlots = availability.filter(slot => slot.type === 'leave');

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
      <div className="space-y-6">
        {/* Weekly Schedule */}
        {scheduleSlots.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Weekly Schedule</h3>
            <div className="space-y-3">
              {scheduleSlots.map((slot, index) => (
                <div
                  key={slot._id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {dayNames[slot.dayOfWeek] || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaves */}
        {leaveSlots.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Leaves / Unavailable</h3>
            <div className="space-y-3">
              {leaveSlots.map((slot, index) => {
                const startDate = slot.startDate ? new Date(slot.startDate) : null;
                const endDate = slot.endDate ? new Date(slot.endDate) : null;
                
                return (
                  <div
                    key={slot._id || index}
                    className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {startDate && endDate
                          ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                          : startDate
                          ? startDate.toLocaleDateString()
                          : 'Leave'}
                      </p>
                      {slot.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{slot.reason}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-sm font-medium">
                      Unavailable
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {scheduleSlots.length === 0 && leaveSlots.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">No availability information available</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Doctor Availability</h1>
          <p className="text-gray-600 dark:text-gray-400">Check when doctors are available for appointments</p>
        </div>

        {/* Doctor Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select a Doctor
          </label>
          <select
            value={selectedDoctor?._id || ''}
            onChange={(e) => {
              const doctor = doctors.find(d => d._id === e.target.value);
              if (doctor) handleDoctorSelect(doctor);
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                Dr. {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Display */}
        {selectedDoctor ? (
          isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading availability...</div>
          ) : (
            <>
              {/* View Mode Toggle */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Dr. {selectedDoctor.name} - {selectedDoctor.specialization}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'calendar'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Calendar View
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Schedule List
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar or List View */}
              {viewMode === 'calendar' ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <DoctorAvailabilityCalendar 
                    availability={availability}
                    doctorId={selectedDoctor._id}
                    readOnly={true}
                  />
                </div>
              ) : renderScheduleList()}

              {/* Quick Book Button */}
              <div className="mt-6 text-center">
                <Link
                  to={`/patient/book-appointment?doctorId=${selectedDoctor._id}`}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
                >
                  Book Appointment with Dr. {selectedDoctor.name}
                </Link>
              </div>
            </>
          )
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 border border-gray-200 dark:border-gray-700 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please select a doctor to view their availability</p>
            <Link
              to="/patient/find-doctor"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Doctors
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAvailability;
