import React, { useState, useEffect } from 'react';

const DoctorAvailabilityCalendar = ({ 
  availability = [], 
  doctorId = null, 
  onDateClick = null,
  readOnly = false 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyView, setMonthlyView] = useState({});

  useEffect(() => {
    updateMonthlyView();
  }, [availability, currentMonth, currentYear]);

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

  const updateMonthlyView = () => {
    const view = {};
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Initialize all days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay();
      const dateKey = `${currentYear}-${currentMonth}-${day}`;
      
      // Sunday is always leave
      if (dayOfWeek === 0) {
        view[dateKey] = { status: 'leave', reason: 'Sunday - Weekly off', isSunday: true };
      } else {
        view[dateKey] = { status: 'available' };
      }
    }
    
    // First, process leave periods
    availability.forEach(item => {
      if (item.type === 'leave' && item.isActive) {
        const start = new Date(item.startDate);
        const end = new Date(item.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const dayOfWeek = d.getDay();
            // Don't override Sunday status
            if (dayOfWeek !== 0) {
              view[dateKey] = { status: 'leave', reason: item.reason || 'Leave' };
            }
          }
        }
      }
    });
    
    // Then, process specific date schedules (these override leave periods)
    availability.forEach(item => {
      if (item.type === 'schedule' && item.isActive && item.startDate) {
        const scheduleDate = new Date(item.startDate);
        if (scheduleDate.getMonth() === currentMonth && scheduleDate.getFullYear() === currentYear) {
          const dateKey = `${scheduleDate.getFullYear()}-${scheduleDate.getMonth()}-${scheduleDate.getDate()}`;
          // Schedule entries override leave periods
          view[dateKey] = { 
            status: 'available', 
            startTime: item.startTime,
            endTime: item.endTime
          };
        }
      }
    });
    
    setMonthlyView(view);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push(date);
    }
    
    return days.map((date, index) => {
      if (!date) {
        return <div key={`empty-${index}`} className="aspect-square"></div>;
      }
      
      const dayOfWeek = date.getDay();
      const dateKey = `${currentYear}-${currentMonth}-${date.getDate()}`;
      const dayStatus = monthlyView[dateKey] || { status: dayOfWeek === 0 ? 'leave' : 'available' };
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      const isSunday = dayOfWeek === 0;
      
      let bgColor = '';
      let textColor = '';
      
      if (isSunday || dayStatus.status === 'leave') {
        bgColor = isSunday 
          ? 'bg-red-100 dark:bg-red-900/30 border-red-500' 
          : 'bg-orange-100 dark:bg-orange-900/30 border-orange-500';
        textColor = isSunday 
          ? 'text-red-800 dark:text-red-300' 
          : 'text-orange-800 dark:text-orange-300';
      } else {
        bgColor = 'bg-green-100 dark:bg-green-900/30 border-green-500';
        textColor = 'text-green-800 dark:text-green-300';
      }
      
      return (
        <button
          key={date.getTime()}
          type="button"
          onClick={() => !readOnly && !isPast && !isSunday && onDateClick && onDateClick(date)}
          disabled={readOnly || isPast || isSunday || !onDateClick}
          className={`aspect-square flex flex-col items-center justify-center text-sm rounded-lg border-2 transition-all ${
            isPast || isSunday || readOnly
              ? `${bgColor} ${textColor} ${readOnly ? 'cursor-default' : 'cursor-not-allowed'} opacity-60`
              : `${bgColor} ${textColor} hover:opacity-80 cursor-pointer`
          } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
          title={
            isSunday 
              ? 'Sunday - Weekly off' 
              : dayStatus.status === 'leave' 
              ? `Leave: ${dayStatus.reason || 'Leave'}` 
              : `Available: ${dayStatus.startTime || '09:00'} - ${dayStatus.endTime || '17:00'}`
          }
        >
          <span className={`font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {date.getDate()}
          </span>
          {dayStatus.status === 'leave' && !isSunday && (
            <span className="text-xs mt-1">L</span>
          )}
        </button>
      );
    });
  };

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear(currentYear - 1);
            } else {
              setCurrentMonth(currentMonth - 1);
            }
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear(currentYear + 1);
            } else {
              setCurrentMonth(currentMonth + 1);
            }
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Leave (Sunday)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 rounded"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Leave (Marked)</span>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailabilityCalendar;

