import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/apiService';

const DoctorAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('availability'); // 'availability' or 'leave'
  const [editingItem, setEditingItem] = useState(null);
  
  // Availability form state
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    maxAppointments: '',
    notes: '',
  });
  
  const [showAvailabilityCalendar, setShowAvailabilityCalendar] = useState(false);
  const [availabilityCalendarMonth, setAvailabilityCalendarMonth] = useState(new Date().getMonth());
  const [availabilityCalendarYear, setAvailabilityCalendarYear] = useState(new Date().getFullYear());
  
  // Leave form state
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });
  
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startCalendarMonth, setStartCalendarMonth] = useState(new Date().getMonth());
  const [startCalendarYear, setStartCalendarYear] = useState(new Date().getFullYear());
  const [endCalendarMonth, setEndCalendarMonth] = useState(new Date().getMonth());
  const [endCalendarYear, setEndCalendarYear] = useState(new Date().getFullYear());
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAvailability();
  }, []);

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStartCalendar && !event.target.closest('.relative')) {
        setShowStartCalendar(false);
      }
      if (showEndCalendar && !event.target.closest('.relative')) {
        setShowEndCalendar(false);
      }
      if (showAvailabilityCalendar && !event.target.closest('.relative')) {
        setShowAvailabilityCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStartCalendar, showEndCalendar, showAvailabilityCalendar]);

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMyAvailability();
      if (response.data.success) {
        setAvailability(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setScheduleForm({ 
      date: '', 
      startTime: '', 
      endTime: '', 
      maxAppointments: '',
      notes: '',
    });
    setLeaveForm({ startDate: '', endDate: '', reason: '' });
    setEditingItem(null);
    setShowStartCalendar(false);
    setShowEndCalendar(false);
    setShowAvailabilityCalendar(false);
    setError('');
    setSuccess('');
  };

  // Calendar helper functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date, type) => {
    const dateStr = formatDateForInput(date);
    if (type === 'start') {
      setLeaveForm({ ...leaveForm, startDate: dateStr });
      setShowStartCalendar(false);
      // If end date is before start date, update it
      if (leaveForm.endDate && new Date(dateStr) > new Date(leaveForm.endDate)) {
        setLeaveForm({ ...leaveForm, startDate: dateStr, endDate: dateStr });
      }
    } else {
      setLeaveForm({ ...leaveForm, endDate: dateStr });
      setShowEndCalendar(false);
    }
  };

  const renderCalendar = (month, year, selectedDate, minDate, onDateSelect, onClose) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }

    return (
      <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (month === 0) {
                setStartCalendarMonth(11);
                setStartCalendarYear(year - 1);
              } else {
                setStartCalendarMonth(month - 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <button
            type="button"
            onClick={() => {
              if (month === 11) {
                setStartCalendarMonth(0);
                setStartCalendarYear(year + 1);
              } else {
                setStartCalendarMonth(month + 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const dateStr = formatDateForInput(date);
            const isSelected = selectedDate === dateStr;
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today;
            const isDisabled = minDate && date < new Date(minDate);

            return (
              <button
                key={date.getTime()}
                type="button"
                onClick={() => {
                  if (!isDisabled && !isPast) {
                    onDateSelect(date, 'start');
                  }
                }}
                disabled={isDisabled || isPast}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-purple-600 text-white font-semibold'
                    : isToday
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                    : isDisabled || isPast
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    );
  };

  const renderEndCalendar = (month, year, selectedDate, minDate, onDateSelect, onClose) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }

    return (
      <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (month === 0) {
                setEndCalendarMonth(11);
                setEndCalendarYear(year - 1);
              } else {
                setEndCalendarMonth(month - 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <button
            type="button"
            onClick={() => {
              if (month === 11) {
                setEndCalendarMonth(0);
                setEndCalendarYear(year + 1);
              } else {
                setEndCalendarMonth(month + 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const dateStr = formatDateForInput(date);
            const isSelected = selectedDate === dateStr;
            const isToday = date.toDateString() === today.toDateString();
            const isPast = minDate ? date < new Date(minDate) : date < today;

            return (
              <button
                key={date.getTime()}
                type="button"
                onClick={() => {
                  if (!isPast) {
                    onDateSelect(date, 'end');
                  }
                }}
                disabled={isPast}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-purple-600 text-white font-semibold'
                    : isToday
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                    : isPast
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    );
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!scheduleForm.date) {
      setError('Please select a date');
      return;
    }

    if (!scheduleForm.startTime || !scheduleForm.endTime) {
      setError('Please set start time and end time');
      return;
    }

    if (scheduleForm.startTime >= scheduleForm.endTime) {
      setError('End time must be after start time');
      return;
    }

    // Check if date is in the past
    const selectedDate = new Date(scheduleForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Cannot set availability for past dates');
      return;
    }

    try {
      const data = {
        type: 'schedule',
        startDate: scheduleForm.date,
        endDate: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        appointmentDuration: 30, // Fixed 30 minutes for all appointments
        maxAppointments: scheduleForm.maxAppointments ? parseInt(scheduleForm.maxAppointments) : undefined,
        notes: scheduleForm.notes.trim() || undefined,
      };

      if (editingItem) {
        await apiService.updateMyAvailability(editingItem._id, data);
        setSuccess('Availability updated successfully!');
      } else {
        await apiService.createMyAvailability(data);
        setSuccess('Availability added successfully!');
      }
      
      resetForms();
      fetchAvailability();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving availability:', error);
      setError(error.response?.data?.message || 'Failed to save availability. Please try again.');
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
      setError('End date must be after or equal to start date');
      return;
    }

    try {
      const data = {
        type: 'leave',
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason.trim(),
      };

      if (editingItem) {
        await apiService.updateMyAvailability(editingItem._id, data);
        setSuccess('Leave updated successfully!');
      } else {
        await apiService.createMyAvailability(data);
        setSuccess('Leave added successfully!');
      }
      
      resetForms();
      fetchAvailability();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving leave:', error);
      setError(error.response?.data?.message || 'Failed to save leave. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (item.type === 'schedule') {
      const dateStr = item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '';
      setScheduleForm({
        date: dateStr,
        startTime: item.startTime || '',
        endTime: item.endTime || '',
        maxAppointments: item.maxAppointments?.toString() || '',
        notes: item.notes || '',
      });
      setActiveTab('availability');
    } else {
      setLeaveForm({
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
        reason: item.reason || '',
      });
      setActiveTab('leave');
    }
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this?')) {
      return;
    }

    try {
      await apiService.deleteMyAvailability(id);
      setSuccess('Deleted successfully!');
      fetchAvailability();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting:', error);
      setError(error.response?.data?.message || 'Failed to delete. Please try again.');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await apiService.updateMyAvailability(item._id, { isActive: !item.isActive });
      setSuccess(`Leave ${!item.isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchAvailability();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating:', error);
      setError(error.response?.data?.message || 'Failed to update. Please try again.');
    }
  };

  const handleAvailabilityDateSelect = (date) => {
    const dateStr = formatDateForInput(date);
    setScheduleForm({ ...scheduleForm, date: dateStr });
    setShowAvailabilityCalendar(false);
  };

  const renderAvailabilityCalendar = (month, year, selectedDate, onDateSelect, onClose) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }

    return (
      <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (month === 0) {
                setAvailabilityCalendarMonth(11);
                setAvailabilityCalendarYear(year - 1);
              } else {
                setAvailabilityCalendarMonth(month - 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <button
            type="button"
            onClick={() => {
              if (month === 11) {
                setAvailabilityCalendarMonth(0);
                setAvailabilityCalendarYear(year + 1);
              } else {
                setAvailabilityCalendarMonth(month + 1);
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const dateStr = formatDateForInput(date);
            const isSelected = selectedDate === dateStr;
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today;

            return (
              <button
                key={date.getTime()}
                type="button"
                onClick={() => {
                  if (!isPast) {
                    onDateSelect(date);
                  }
                }}
                disabled={isPast}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold'
                    : isToday
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : isPast
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const schedules = availability.filter(item => item.type === 'schedule' && item.isActive);
  const leaves = availability.filter(item => item.type === 'leave');

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Schedule & Leave
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Set your weekly availability and manage leave dates
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
                setActiveTab('availability');
                resetForms();
              }}
              className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                activeTab === 'availability'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
                Availability
              </div>
          </button>
          <button
            onClick={() => {
                setActiveTab('leave');
                resetForms();
              }}
              className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                activeTab === 'leave'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
                Leave Management
              </div>
          </button>
        </div>

          {/* Availability Tab Content */}
          {activeTab === 'availability' && (
            <div className="p-6">
              <form onSubmit={handleScheduleSubmit} className="mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {editingItem ? 'Edit Availability' : 'Add Availability'}
                  </h3>
                  
                  <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> All appointments are 30 minutes duration. Set your availability for a specific date with time slots.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={scheduleForm.date ? formatDateForInput(new Date(scheduleForm.date)) : ''}
                          readOnly
                          onClick={() => {
                            setShowAvailabilityCalendar(!showAvailabilityCalendar);
                            setShowStartCalendar(false);
                            setShowEndCalendar(false);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          placeholder="Select date"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowAvailabilityCalendar(!showAvailabilityCalendar);
                            setShowStartCalendar(false);
                            setShowEndCalendar(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {showAvailabilityCalendar && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowAvailabilityCalendar(false)}
                            ></div>
                            {renderAvailabilityCalendar(
                              availabilityCalendarMonth,
                              availabilityCalendarYear,
                              scheduleForm.date,
                              handleAvailabilityDateSelect,
                              () => setShowAvailabilityCalendar(false)
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          // Ensure proper format HH:MM
                          if (timeValue && timeValue.match(/^\d{2}:\d{2}$/)) {
                            setScheduleForm({...scheduleForm, startTime: timeValue});
                          } else if (timeValue) {
                            setScheduleForm({...scheduleForm, startTime: timeValue});
                          }
                        }}
                        step="1800"
                        min="00:00"
                        max="23:59"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Click to select time or type in format: <strong>09:00</strong> (24-hour format)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          // Ensure proper format HH:MM
                          if (timeValue && timeValue.match(/^\d{2}:\d{2}$/)) {
                            setScheduleForm({...scheduleForm, endTime: timeValue});
                          } else if (timeValue) {
                            setScheduleForm({...scheduleForm, endTime: timeValue});
                          }
                        }}
                        step="1800"
                        min={scheduleForm.startTime || "00:00"}
                        max="23:59"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Click to select time or type in format: <strong>17:00</strong> (24-hour format)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Max Appointments (Optional)
                  </label>
                  <input
                        type="number"
                        min="1"
                        value={scheduleForm.maxAppointments}
                        onChange={(e) => setScheduleForm({...scheduleForm, maxAppointments: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Leave empty for unlimited"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Maximum number of appointments allowed on this date
                      </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Special Notes (Optional)
                  </label>
                  <input
                        type="text"
                        value={scheduleForm.notes}
                        onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Emergency appointments only, Special location"
                  />
                </div>
              </div>
                  
                  <div className="flex gap-3">
                <button
                  type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                      {editingItem ? 'Update' : 'Add Availability'}
                </button>
                    {editingItem && (
                <button
                  type="button"
                        onClick={resetForms}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                    )}
              </div>
          </div>
              </form>

              {/* Availability Dates Display */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Available Dates</h3>
          {isLoading ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : schedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schedules.map((schedule) => {
                      const scheduleDate = schedule.startDate ? new Date(schedule.startDate) : null;
                      
                      return (
                        <div
                          key={schedule._id}
                          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border-2 border-blue-300 dark:border-blue-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                {scheduleDate ? formatDate(schedule.startDate) : 'Date not set'}
                              </h4>
                              {schedule.startTime && schedule.endTime && (
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                                  Available
                                </span>
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                  30 min slots
                                </span>
                                {schedule.maxAppointments && (
                                  <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded">
                                    Max: {schedule.maxAppointments}
                                  </span>
                                )}
                              </div>
                              {schedule.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                                  {schedule.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(schedule)}
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Edit"
                    >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(schedule._id)}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete"
                    >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                    </button>
                  </div>
                </div>
                        </div>
                      );
                    })}
            </div>
          ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
                    <p className="text-lg text-gray-600 dark:text-gray-400">No availability dates set yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Add your available dates above</p>
            </div>
          )}
        </div>
            </div>
          )}

          {/* Leave Tab Content */}
          {activeTab === 'leave' && (
            <div className="p-6">
              <form onSubmit={handleLeaveSubmit} className="mb-8">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {editingItem ? 'Edit Leave' : 'Add Leave'}
                  </h3>
                  
                  <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <strong>Note:</strong> Leave blocks the entire day(s). No appointments can be booked during leave periods.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={leaveForm.startDate ? formatDateForInput(new Date(leaveForm.startDate)) : ''}
                          readOnly
                          onClick={() => {
                            setShowStartCalendar(!showStartCalendar);
                            setShowEndCalendar(false);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          placeholder="Select start date"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowStartCalendar(!showStartCalendar);
                            setShowEndCalendar(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
                        </button>
                        {showStartCalendar && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowStartCalendar(false)}
                            ></div>
                            {renderCalendar(
                              startCalendarMonth,
                              startCalendarYear,
                              leaveForm.startDate,
                              new Date().toISOString().split('T')[0],
                              (date) => handleDateSelect(date, 'start'),
                              () => setShowStartCalendar(false)
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={leaveForm.endDate ? formatDateForInput(new Date(leaveForm.endDate)) : ''}
                          readOnly
                          onClick={() => {
                            setShowEndCalendar(!showEndCalendar);
                            setShowStartCalendar(false);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          placeholder="Select end date"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowEndCalendar(!showEndCalendar);
                            setShowStartCalendar(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {showEndCalendar && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowEndCalendar(false)}
                            ></div>
                            {renderEndCalendar(
                              endCalendarMonth,
                              endCalendarYear,
                              leaveForm.endDate,
                              leaveForm.startDate || new Date().toISOString().split('T')[0],
                              (date) => handleDateSelect(date, 'end'),
                              () => setShowEndCalendar(false)
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Reason
                    </label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter reason for leave..."
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      {editingItem ? 'Update Leave' : 'Add Leave'}
                    </button>
                    {editingItem && (
                      <button
                        type="button"
                        onClick={resetForms}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Leave List Display */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Leave Dates</h3>
          {isLoading ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : leaves.length > 0 ? (
                  <div className="space-y-3">
                    {leaves.map((leave) => {
                      const startDate = new Date(leave.startDate);
                      const endDate = new Date(leave.endDate);
                      const isSameDay = startDate.toDateString() === endDate.toDateString();
                      const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                      
                      return (
                <div
                  key={leave._id}
                          className={`rounded-lg p-5 border-2 ${
                    leave.isActive
                              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                                  {isSameDay 
                                    ? formatDate(leave.startDate)
                                    : `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`
                                  }
                                </h4>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        leave.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {leave.isActive ? 'Active' : 'Inactive'}
                      </span>
                                {!isSameDay && (
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    ({daysCount} {daysCount === 1 ? 'day' : 'days'})
                                  </span>
                                )}
                    </div>
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Reason:</span> {leave.reason}
                              </p>
                  </div>
                            <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(leave)}
                                className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                title="Edit"
                    >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(leave)}
                                className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                                title={leave.isActive ? 'Deactivate' : 'Activate'}
                    >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(leave._id)}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete"
                    >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                    </button>
                  </div>
                </div>
                        </div>
                      );
                    })}
            </div>
          ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
                    <p className="text-lg text-gray-600 dark:text-gray-400">No leave dates set yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Add your leave dates above</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
