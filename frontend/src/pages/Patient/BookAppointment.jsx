import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/feedback/Toast';
import { useRazorpay } from 'react-razorpay';

const BookAppointment = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');

  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [bookedSlots, setBookedSlots] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [leaveDates, setLeaveDates] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '17:00',
    duration: 30
  });
  const [platformFeePercentage, setPlatformFeePercentage] = useState(20);
  const { Razorpay } = useRazorpay();

  const [formData, setFormData] = useState({
    patientName: user?.name || '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    phone: user?.phone || '',
    reason: '',
    consultationNotes: ''
  });

  // Helper function to format date in local timezone (YYYY-MM-DD)
  const formatDateLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get minimum date (24 hours from now)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return formatDateLocal(tomorrow);
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(0, 0, 0, 0);
    return formatDateLocal(maxDate);
  };

  // Generate time slots based on admin working hours settings
  const generateTimeSlots = () => {
    const slots = [];
    
    // Parse working hours from settings
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    const duration = workingHours.duration || 30;
    
    // Convert to minutes for easier calculation
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Generate slots based on duration
    for (let currentMinutes = startMinutes; currentMinutes + duration <= endMinutes; currentMinutes += duration) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Calculate end time
      const endTimeMinutes = currentMinutes + duration;
      const endHourCalc = Math.floor(endTimeMinutes / 60);
      const endMinuteCalc = endTimeMinutes % 60;
      const endTimeString = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`;
      
      // Only add slot if end time is within working hours
      if (endTimeMinutes <= endMinutes) {
        slots.push({
          value: timeString,
          label: `${formatTime(timeString)} - ${formatTime(endTimeString)}`,
          shortLabel: formatTime(timeString),
          endTime: endTimeString
        });
      }
    }
    
    return slots;
  };

  // Format time to 12-hour format
  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Fetch working hours settings
  useEffect(() => {
    const fetchWorkingHours = async () => {
      try {
        // Try to get from localStorage first (faster)
        const cachedSettings = localStorage.getItem('siteSettings');
        if (cachedSettings) {
          const settings = JSON.parse(cachedSettings);
          if (settings.workingHoursStart && settings.workingHoursEnd) {
            setWorkingHours({
              start: settings.workingHoursStart,
              end: settings.workingHoursEnd,
              duration: settings.appointmentDuration || 30
            });
            return;
          }
        }
        
        // Fetch from API if not in cache
        const response = await apiService.getSettings();
        if (response.data.success && response.data.data) {
          const settings = response.data.data;
          setWorkingHours({
            start: settings.workingHoursStart || '09:00',
            end: settings.workingHoursEnd || '17:00',
            duration: settings.appointmentDuration || 30
          });
          setPlatformFeePercentage(settings.platformFeePercentage || settings.platformCommissionPercentage || 20);
          // Cache for future use
          localStorage.setItem('siteSettings', JSON.stringify(settings));
        }
      } catch (error) {
        console.error('Error fetching working hours:', error);
        // Use defaults if fetch fails
        setWorkingHours({
          start: '09:00',
          end: '17:00',
          duration: 30
        });
      }
    };
    
    fetchWorkingHours();
  }, []);

  // Generate time slots when working hours change
  const timeSlots = useMemo(() => generateTimeSlots(), [workingHours]);

  useEffect(() => {
    if (!isAuthenticated) {
      setToast({ message: 'Please login to book an appointment', type: 'error' });
      setIsLoading(false);
      return;
    }
    
    if (user?.role !== 'patient') {
      setToast({ message: 'Only patients can book appointments', type: 'error' });
      setIsLoading(false);
      return;
    }
    
    if (user?.name) {
      setFormData(prev => ({ ...prev, patientName: user.name }));
    }
    
    if (doctorId) {
      fetchDoctor();
      fetchDoctorAvailability();
      if (formData.appointmentDate) {
        fetchBookedSlots(formData.appointmentDate);
      }
    } else {
      setIsLoading(false);
    }
  }, [doctorId, isAuthenticated, user]);

  useEffect(() => {
    if (formData.appointmentDate && doctorId) {
      fetchBookedSlots(formData.appointmentDate);
    }
  }, [formData.appointmentDate, doctorId]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.calendar-container') && !event.target.closest('input[name="appointmentDate"]')) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const fetchDoctor = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getDoctor(doctorId);
      if (response.data && response.data.success) {
        setDoctor(response.data.data);
      } else {
        setToast({ message: 'Failed to load doctor information. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load doctor information';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookedSlots = async (date) => {
    try {
      const response = await apiService.getAppointments({ 
        doctorId, 
        date,
        status: 'pending,confirmed'
      });
      if (response.data.success) {
        const slots = (response.data.data || []).map(apt => apt.startTime);
        setBookedSlots(slots);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const fetchDoctorAvailability = async () => {
    if (!doctorId) return;
    try {
      const response = await apiService.getDoctorAvailability(doctorId);
      if (response.data.success) {
        const availability = response.data.data || [];
        setDoctorAvailability(availability);
        
        // Extract leave dates
        const leaves = availability.filter(item => item.type === 'leave' && item.isActive);
        const leaveDateSet = new Set();
        
        leaves.forEach(leave => {
          if (leave.startDate && leave.endDate) {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            // Check if there's a specific schedule override for any date in this leave period
            const schedules = availability.filter(item => 
              item.type === 'schedule' && 
              item.isActive && 
              item.startDate
            );
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dateStr = formatDateLocal(d);
              // Only add to leave dates if there's no schedule override for this specific date
              const hasScheduleOverride = schedules.some(schedule => {
                const scheduleDate = new Date(schedule.startDate);
                scheduleDate.setHours(0, 0, 0, 0);
                return formatDateLocal(scheduleDate) === dateStr;
              });
              
              if (!hasScheduleOverride) {
                leaveDateSet.add(dateStr);
              }
            }
          }
        });
        
        setLeaveDates(Array.from(leaveDateSet));
      }
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'startTime') {
      const selectedSlot = timeSlots.find(slot => slot.value === value);
      if (selectedSlot) {
        setFormData(prev => ({
          ...prev,
          startTime: selectedSlot.value,
          endTime: selectedSlot.endTime
        }));
      }
    } else if (name === 'appointmentDate') {
      // Validate that the selected date is not a Sunday or on leave
      if (value) {
        const selectedDate = new Date(value);
        const dayOfWeek = selectedDate.getDay();
        
        if (dayOfWeek === 0) {
          setFieldErrors(prev => ({ ...prev, appointmentDate: 'Appointments cannot be booked on Sundays. Please select another day.' }));
          return;
        }
        
        if (leaveDates.includes(value)) {
          setFieldErrors(prev => ({ ...prev, appointmentDate: 'Doctor is on leave on this date. Please select another date.' }));
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        startTime: '',
        endTime: ''
      }));
    } else if (name === 'phone') {
      // Only allow digits, max 10
      const phoneDigits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: phoneDigits
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!doctorId) {
      errors.doctor = 'Please select a doctor first';
      isValid = false;
    }

    if (!formData.patientName || formData.patientName.trim() === '') {
      errors.patientName = 'Patient name is required';
      isValid = false;
    }

    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Please select an appointment date';
      isValid = false;
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const dayOfWeek = selectedDate.getDay();
      
      // Check if Sunday
      if (dayOfWeek === 0) {
        errors.appointmentDate = 'Appointments cannot be booked on Sundays. Please select another day.';
        isValid = false;
      }
      
      // Check if on leave
      if (leaveDates.includes(formData.appointmentDate)) {
        errors.appointmentDate = 'Doctor is on leave on this date. Please select another date.';
        isValid = false;
      }
      
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.startTime || '12:00'}`);
      const now = new Date();
      const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);
      
      if (hoursDifference < 24) {
        errors.appointmentDate = 'Appointments must be booked at least 24 hours in advance';
        isValid = false;
      }
    }

    if (!formData.startTime || !formData.endTime) {
      errors.startTime = 'Please select an appointment time';
      isValid = false;
    }

    if (!formData.phone || formData.phone.trim() === '') {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        errors.phone = 'Please enter a valid 10-digit phone number';
        isValid = false;
      }
    }

    if (!formData.reason || formData.reason.trim() === '') {
      errors.reason = 'Please provide a reason for the appointment';
      isValid = false;
    }

    setFieldErrors(errors);
    
    // Scroll to first error field
    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 1. Create Razorpay order for platform fee (online payment)
      const orderResponse = await apiService.createPaymentOrder({ doctorId });
      
      if (!orderResponse.data.success) {
        throw new Error('Failed to initiate payment. Please try again.');
      }
      
      const orderData = orderResponse.data.data;
      
      // Verify we have the correct amount
      const expectedOnlineAmount = Math.round(((doctor?.bookingFee || doctor?.consultationFee || 500) * platformFeePercentage) / 100);
      if (orderData.amount !== expectedOnlineAmount * 100) {
        console.warn('Order amount mismatch. Expected:', expectedOnlineAmount, 'Got:', orderData.amount / 100);
      }
      
      // 2. Initialize Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DOXI Healthcare',
        description: `Platform Fee for Dr. ${doctor?.name} appointment`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // 3. Complete booking logic on successful payment
            const bookingResponse = await apiService.bookAppointment({
              doctorId,
              appointmentDate: formData.appointmentDate,
              startTime: formData.startTime,
              endTime: formData.endTime,
              consultationNotes: formData.consultationNotes || formData.reason,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (bookingResponse.data.success) {
              setToast({ message: 'Payment successful! Appointment booked.', type: 'success' });
              setTimeout(() => {
                navigate('/patient/appointments');
              }, 2000);
            }
          } catch (bookingError) {
             console.error('Error finalizing appointment:', bookingError);
             setToast({ message: 'Payment captured, but failed to book appointment. Please contact support.', type: 'error' });
             setIsSubmitting(false);
          }
        },
        prefill: {
          name: formData.patientName,
          email: user?.email,
          contact: formData.phone
        },
        theme: {
          color: '#2563EB' // blue-600
        },
        modal: {
          ondismiss: () => {
            setToast({ message: 'Payment cancelled.', type: 'info' });
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new Razorpay(options);
      
      rzp.on('payment.failed', function (response){
        console.error('Payment Failed:', response.error);
        setToast({ message: `Payment failed: ${response.error.description}`, type: 'error' });
        setIsSubmitting(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Error booking appointment:', error);
      let errorMessage = 'Failed to book appointment. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'You are not authenticated. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please make sure you are logged in as a patient.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar component
  const renderCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const today = new Date();
    const minDate = new Date(getMinDate());
    const maxDate = new Date(getMaxDate());
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dateString = formatDateLocal(date);
      const isPast = date < minDate;
      const isFuture = date > maxDate;
      const isSelected = formData.appointmentDate === dateString;
      const isToday = dateString === formatDateLocal(today);
      const isSunday = date.getDay() === 0;
      const isOnLeave = leaveDates.includes(dateString);
      
      days.push({
        day,
        date: dateString,
        disabled: isPast || isFuture || isSunday || isOnLeave,
        selected: isSelected,
        today: isToday,
        isSunday,
        isOnLeave
      });
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return (
      <div className="calendar-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayData, index) => {
            if (!dayData) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            return (
              <button
                key={dayData.date}
                type="button"
                onClick={() => {
                  if (!dayData.disabled) {
                    handleChange({ target: { name: 'appointmentDate', value: dayData.date } });
                    setShowCalendar(false);
                  }
                }}
                disabled={dayData.disabled}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg transition-colors relative
                  ${dayData.disabled 
                    ? dayData.isSunday || dayData.isOnLeave
                      ? 'text-gray-400 dark:text-gray-600 bg-red-50 dark:bg-red-900/20 cursor-not-allowed'
                      : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : dayData.selected
                    ? 'bg-blue-600 text-white font-semibold'
                    : dayData.today
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                  }
                `}
                title={dayData.isSunday ? 'Sunday - No appointments available' : dayData.isOnLeave ? 'Doctor is on leave' : ''}
              >
                {dayData.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Book Appointment</h1>
          <p className="text-base text-gray-600 dark:text-gray-400">Schedule an appointment with your doctor</p>
        </div>

        {/* Doctor Info Card */}
        {doctor && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xl">
                {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Dr. {doctor.name}
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400">{doctor.specialization}</p>
                {doctor.location && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    📍 {doctor.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        {doctor && (() => {
          const doctorBookingFee = doctor.bookingFee || doctor.consultationFee || 500;
          const onlineAmount = Math.round((doctorBookingFee * platformFeePercentage) / 100);
          const clinicAmount = doctorBookingFee - onlineAmount;
          
          return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
               </svg>
               Payment Details
             </h3>
             <div className="space-y-3">
               <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                 <span>Doctor's Booking Fee</span>
                 <span className="font-medium text-gray-900 dark:text-white">₹{doctorBookingFee}</span>
               </div>
               <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                 <span>Pay Online Now ({platformFeePercentage}%) <span className="text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full ml-2">Platform Fee</span></span>
                 <span className="font-semibold text-blue-600 dark:text-blue-400">₹{onlineAmount}</span>
               </div>
               <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                 <span className="font-semibold text-gray-900 dark:text-white">Pay at Clinic</span>
                 <span className="font-semibold text-xl text-green-600 dark:text-green-500">₹{clinicAmount}</span>
               </div>
             </div>
             <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
               Pay the platform fee online to secure your appointment slot. The remaining amount is paid directly to the doctor at the clinic.
             </p>
          </div>
          );
        })()}

        {/* Appointment Rules - Full Width */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Appointment Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base text-blue-800 dark:text-blue-400">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>Appointments must be booked at least <strong>24 hours in advance</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>Each appointment duration is <strong>30 minutes</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>You can book appointments up to <strong>30 days in advance</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>Appointments are available from <strong>{formatTime(workingHours.start)} to {formatTime(workingHours.end)}</strong></span>
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
              <span>Your appointment will be <strong>pending</strong> until the doctor <strong>approves and confirms</strong> it. You will be notified once confirmed.</span>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700">
          {!doctorId && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-base text-yellow-800 dark:text-yellow-400">
                Please select a doctor from the <a href="/patient/find-doctor" className="underline font-medium">Find Doctor</a> page first.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Patient Name & Phone - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.patientName 
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {fieldErrors.patientName && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {fieldErrors.patientName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    required
                    className={`w-full px-4 py-3 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.phone 
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {fieldErrors.phone ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {fieldErrors.phone}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Enter 10 digits only
                    </p>
                  )}
                </div>
              </div>

              {/* Appointment Date */}
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Appointment Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                    className={`w-full px-4 py-3 pr-12 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                      fieldErrors.appointmentDate
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors pointer-events-auto"
                  >
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                {showCalendar && (
                  <div className="absolute z-10 mt-2 calendar-container">
                    {renderCalendar()}
                  </div>
                )}
                {fieldErrors.appointmentDate ? (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {fieldErrors.appointmentDate}
                  </p>
                ) : formData.appointmentDate && (
                  <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
                    Selected: {new Date(formData.appointmentDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>

              {/* Appointment Time - Grid */}
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Appointment Time <span className="text-red-500">*</span>
                </label>
                {!formData.appointmentDate ? (
                  <p className="text-base text-gray-500 dark:text-gray-400 py-3">Please select a date first</p>
                ) : (
                  <div className={`grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/30 ${
                    fieldErrors.startTime 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    {timeSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot.value);
                      const isSelected = formData.startTime === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => {
                            if (!isBooked) {
                              handleChange({ target: { name: 'startTime', value: slot.value } });
                            }
                          }}
                          disabled={isBooked}
                          className={`
                            px-3 py-2.5 text-sm rounded-lg transition-colors font-medium
                            ${isBooked
                              ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-600 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 border border-gray-300 dark:border-gray-600'
                            }
                          `}
                        >
                          {slot.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
                {fieldErrors.startTime ? (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {fieldErrors.startTime}
                  </p>
                ) : formData.startTime && (
                  <p className="text-base text-gray-600 dark:text-gray-400 mt-3 font-medium">
                    Selected Time: {timeSlots.find(s => s.value === formData.startTime)?.label} (30 minutes duration)
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Appointment <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="e.g., General checkup, Follow-up, Specific symptoms"
                  required
                  className={`w-full px-4 py-3 text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.reason 
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {fieldErrors.reason && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {fieldErrors.reason}
                  </p>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                </label>
                <textarea
                  name="consultationNotes"
                  value={formData.consultationNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your symptoms, medical history, or any other relevant information..."
                  maxLength={500}
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formData.consultationNotes.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSubmitting || !doctorId}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  {isSubmitting ? 'Processing Payment...' : `Pay ₹${Math.round(((doctor?.bookingFee || doctor?.consultationFee || 500) * platformFeePercentage) / 100)} Online & Book`}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/patient/appointments')}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-base font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
