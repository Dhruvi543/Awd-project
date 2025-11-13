import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Availability from '../models/Availability.js';
import Review from '../models/Review.js';

// Get all approved doctors (public)
const getDoctors = asyncHandler(async (req, res) => {
  try {
    const { specialty, search } = req.query;
    
    let query = { role: 'doctor', isApproved: true };
    
    if (specialty) {
      query.specialization = new RegExp(specialty, 'i');
    }
    
    let doctors = await User.find(query)
      .select('-password')
      .sort({ name: 1 });
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      doctors = doctors.filter(doctor =>
        doctor.name?.toLowerCase().includes(searchLower) ||
        doctor.specialization?.toLowerCase().includes(searchLower)
      );
    }
    
    // Get ratings for each doctor
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doctor) => {
        const reviews = await Review.find({ doctor: doctor._id });
        const rating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;
        
        return {
          ...doctor.toObject(),
          rating: rating.toFixed(1),
          reviewCount: reviews.length
        };
      })
    );
    
    res.json({
      success: true,
      data: doctorsWithRatings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
});

// Get single doctor (public)
const getDoctor = asyncHandler(async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor', isApproved: true })
      .select('-password');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Get rating
    const reviews = await Review.find({ doctor: doctor._id });
    const rating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    
    res.json({
      success: true,
      data: {
        ...doctor.toObject(),
        rating: rating.toFixed(1),
        reviewCount: reviews.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor',
      error: error.message
    });
  }
});

// Get doctor availability
const getDoctorAvailability = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    const availability = await Availability.find({
      doctor: doctorId,
      isActive: true
    }).sort({ startDate: 1, startTime: 1 });
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor availability',
      error: error.message
    });
  }
});

// Get current doctor's own availability (authenticated)
const getMyAvailability = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    const availability = await Availability.find({
      doctor: doctorId
    }).sort({ type: 1, startDate: 1, startTime: 1 });
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching availability',
      error: error.message
    });
  }
});

// Create availability/schedule (authenticated doctor)
const createMyAvailability = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { type, dayOfWeek, startTime, endTime, startDate, endDate, reason, appointmentDuration, consultationType, maxAppointments, notes } = req.body;
    
    // Validate required fields based on type
    if (type === 'schedule') {
      // For date-based schedule, require date and times
      if (!startDate || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Date, start time, and end time are required for availability'
        });
      }
      
      // Validate time range
      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
      
      // Validate appointment duration if provided
      if (appointmentDuration && (appointmentDuration < 15 || appointmentDuration > 240)) {
        return res.status(400).json({
          success: false,
          message: 'Appointment duration must be between 15 and 240 minutes'
        });
      }
      
      // Validate consultation type
      if (consultationType && !['in-person', 'online', 'both'].includes(consultationType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid consultation type. Must be: in-person, online, or both'
        });
      }
      
      // Validate max appointments if provided
      if (maxAppointments && maxAppointments < 1) {
        return res.status(400).json({
          success: false,
          message: 'Max appointments must be at least 1'
        });
      }
    } else if (type === 'leave') {
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required for leave'
        });
      }
      
      // Validate date range
      const leaveStart = new Date(startDate);
      const leaveEnd = new Date(endDate);
      leaveStart.setHours(0, 0, 0, 0);
      leaveEnd.setHours(23, 59, 59, 999);
      
      if (leaveStart > leaveEnd) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after or equal to start date'
        });
      }
      
      // Check for overlapping leaves
      const existingLeaves = await Availability.find({
        doctor: doctorId,
        type: 'leave',
        isActive: true
      });
      
      for (const existingLeave of existingLeaves) {
        if (existingLeave.startDate && existingLeave.endDate) {
          const existingStart = new Date(existingLeave.startDate);
          existingStart.setHours(0, 0, 0, 0);
          const existingEnd = new Date(existingLeave.endDate);
          existingEnd.setHours(23, 59, 59, 999);
          
          // Check if dates overlap
          if ((leaveStart <= existingEnd && leaveEnd >= existingStart)) {
            return res.status(400).json({
              success: false,
              message: `Leave dates overlap with existing leave from ${existingStart.toLocaleDateString()} to ${existingEnd.toLocaleDateString()}. Please adjust your dates.`
            });
          }
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "schedule" or "leave"'
      });
    }
    
    const availability = new Availability({
      doctor: doctorId,
      type,
      dayOfWeek,
      startTime,
      endTime,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      reason,
      appointmentDuration: appointmentDuration ? parseInt(appointmentDuration) : undefined,
      consultationType: consultationType || 'both',
      maxAppointments: maxAppointments ? parseInt(maxAppointments) : undefined,
      notes: notes ? notes.trim() : undefined
    });
    
    await availability.save();
    
    res.status(201).json({
      success: true,
      message: 'Availability created successfully',
      data: availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating availability',
      error: error.message
    });
  }
});

// Update availability (authenticated doctor)
const updateMyAvailability = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { id } = req.params;
    const { type, dayOfWeek, startTime, endTime, startDate, endDate, reason, isActive, appointmentDuration, consultationType, maxAppointments, notes } = req.body;
    
    const availability = await Availability.findById(id);
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found'
      });
    }
    
    // Check if the availability belongs to the doctor
    if (availability.doctor.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this availability'
      });
    }
    
    // If updating leave dates, check for overlaps
    if ((type === 'leave' || availability.type === 'leave') && (startDate || endDate)) {
      const checkStartDate = startDate ? new Date(startDate) : availability.startDate;
      const checkEndDate = endDate ? new Date(endDate) : availability.endDate;
      
      if (checkStartDate && checkEndDate) {
        const leaveStart = new Date(checkStartDate);
        const leaveEnd = new Date(checkEndDate);
        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(23, 59, 59, 999);
        
        if (leaveStart > leaveEnd) {
          return res.status(400).json({
            success: false,
            message: 'End date must be after or equal to start date'
          });
        }
        
        // Check for overlapping leaves (excluding current leave)
        const existingLeaves = await Availability.find({
          doctor: doctorId,
          type: 'leave',
          isActive: true,
          _id: { $ne: id }
        });
        
        for (const existingLeave of existingLeaves) {
          if (existingLeave.startDate && existingLeave.endDate) {
            const existingStart = new Date(existingLeave.startDate);
            existingStart.setHours(0, 0, 0, 0);
            const existingEnd = new Date(existingLeave.endDate);
            existingEnd.setHours(23, 59, 59, 999);
            
            // Check if dates overlap
            if ((leaveStart <= existingEnd && leaveEnd >= existingStart)) {
              return res.status(400).json({
                success: false,
                message: `Leave dates overlap with existing leave from ${existingStart.toLocaleDateString()} to ${existingEnd.toLocaleDateString()}. Please adjust your dates.`
              });
            }
          }
        }
      }
    }
    
    // Validate time range if updating schedule times
    if (type === 'schedule' && startTime && endTime) {
      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
    }
    
    // Validate appointment duration if provided
    if (appointmentDuration !== undefined) {
      const duration = parseInt(appointmentDuration);
      if (duration < 15 || duration > 240) {
        return res.status(400).json({
          success: false,
          message: 'Appointment duration must be between 15 and 240 minutes'
        });
      }
      availability.appointmentDuration = duration;
    }
    
    // Validate consultation type if provided
    if (consultationType && !['in-person', 'online', 'both'].includes(consultationType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid consultation type. Must be: in-person, online, or both'
      });
    }
    
    if (type) availability.type = type;
    if (dayOfWeek !== undefined) availability.dayOfWeek = dayOfWeek;
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    if (startDate) availability.startDate = new Date(startDate);
    if (endDate) availability.endDate = new Date(endDate);
    if (reason !== undefined) availability.reason = reason;
    if (isActive !== undefined) availability.isActive = isActive;
    if (consultationType) availability.consultationType = consultationType;
    if (maxAppointments !== undefined) {
      const max = parseInt(maxAppointments);
      if (max < 1) {
        return res.status(400).json({
          success: false,
          message: 'Max appointments must be at least 1'
        });
      }
      availability.maxAppointments = max || undefined;
    }
    if (notes !== undefined) availability.notes = notes ? notes.trim() : undefined;
    
    await availability.save();
    
    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating availability',
      error: error.message
    });
  }
});

// Delete availability (authenticated doctor)
const deleteMyAvailability = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { id } = req.params;
    
    const availability = await Availability.findById(id);
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found'
      });
    }
    
    // Check if the availability belongs to the doctor
    if (availability.doctor.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this availability'
      });
    }
    
    await Availability.deleteOne({ _id: availability._id });
    
    res.json({
      success: true,
      message: 'Availability deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting availability',
      error: error.message
    });
  }
});

// Generate monthly availability - all days available except Sundays and marked leaves
const generateMonthlyAvailability = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { month, year, startTime, endTime, appointmentDuration, consultationType, maxAppointments } = req.body;
    
    if (!month || !year || month < 0 || month > 11 || year < new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month or year'
      });
    }
    
    // Default values
    const defaultStartTime = startTime || '09:00';
    const defaultEndTime = endTime || '17:00';
    const defaultDuration = appointmentDuration || 30;
    const defaultConsultationType = consultationType || 'both';
    
    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get existing leaves for this month
    const existingLeaves = await Availability.find({
      doctor: doctorId,
      type: 'leave',
      isActive: true,
      $or: [
        {
          startDate: { $lte: lastDay },
          endDate: { $gte: firstDay }
        }
      ]
    });
    
    // Get existing schedules for this month
    const existingSchedules = await Availability.find({
      doctor: doctorId,
      type: 'schedule',
      isActive: true,
      startDate: {
        $gte: firstDay,
        $lte: lastDay
      }
    });
    
    const existingScheduleDates = new Set(
      existingSchedules.map(s => {
        const date = new Date(s.startDate);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );
    
    // Create a set of leave dates
    const leaveDates = new Set();
    existingLeaves.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        leaveDates.add(dateKey);
      }
    });
    
    const createdSchedules = [];
    const createdLeaves = [];
    
    // Generate availability for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dateKey = `${year}-${month}-${day}`;
      
      // Skip if already has a schedule
      if (existingScheduleDates.has(dateKey)) {
        continue;
      }
      
      // Check if this date is in leave dates
      const isLeaveDate = leaveDates.has(dateKey);
      
      // Sunday is always leave
      if (dayOfWeek === 0 || isLeaveDate) {
        // Check if leave already exists for this date
        const existingLeave = existingLeaves.find(leave => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          leaveStart.setHours(0, 0, 0, 0);
          leaveEnd.setHours(23, 59, 59, 999);
          return currentDate >= leaveStart && currentDate <= leaveEnd;
        });
        
        if (!existingLeave) {
          // Create leave entry for Sunday or marked leave date
          const leave = new Availability({
            doctor: doctorId,
            type: 'leave',
            startDate: new Date(year, month, day),
            endDate: new Date(year, month, day),
            reason: dayOfWeek === 0 ? 'Sunday - Weekly off' : 'Leave',
            isActive: true
          });
          await leave.save();
          createdLeaves.push(leave);
        }
      } else {
        // Create availability schedule for this day
        const schedule = new Availability({
          doctor: doctorId,
          type: 'schedule',
          startDate: new Date(year, month, day),
          endDate: new Date(year, month, day),
          startTime: defaultStartTime,
          endTime: defaultEndTime,
          appointmentDuration: defaultDuration,
          consultationType: defaultConsultationType,
          maxAppointments: maxAppointments || undefined,
          isActive: true
        });
        await schedule.save();
        createdSchedules.push(schedule);
      }
    }
    
    res.json({
      success: true,
      message: `Monthly availability generated successfully. ${createdSchedules.length} days available, ${createdLeaves.length} days marked as leave (including Sundays).`,
      data: {
        schedules: createdSchedules,
        leaves: createdLeaves,
        totalAvailable: createdSchedules.length,
        totalLeaves: createdLeaves.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating monthly availability',
      error: error.message
    });
  }
});

// Toggle date between available and leave
const toggleDateAvailability = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { date, reason } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const dayOfWeek = targetDate.getDay();
    
    // Check if it's a Sunday
    if (dayOfWeek === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sundays are automatically marked as leave and cannot be changed'
      });
    }
    
    // Check if there's an existing schedule for this date
    const existingSchedule = await Availability.findOne({
      doctor: doctorId,
      type: 'schedule',
      startDate: {
        $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
      },
      isActive: true
    });
    
    // Check if there's an existing leave for this date
    const existingLeave = await Availability.findOne({
      doctor: doctorId,
      type: 'leave',
      startDate: {
        $lte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59)
      },
      endDate: {
        $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
      },
      isActive: true
    });
    
    if (existingSchedule) {
      // Convert schedule to leave
      await Availability.deleteOne({ _id: existingSchedule._id });
      
      const leave = new Availability({
        doctor: doctorId,
        type: 'leave',
        startDate: targetDate,
        endDate: targetDate,
        reason: reason || 'Leave',
        isActive: true
      });
      await leave.save();
      
      res.json({
        success: true,
        message: 'Date marked as leave',
        data: { type: 'leave', availability: leave }
      });
    } else if (existingLeave) {
      // Convert leave to schedule (available)
      await Availability.deleteOne({ _id: existingLeave._id });
      
      const schedule = new Availability({
        doctor: doctorId,
        type: 'schedule',
        startDate: targetDate,
        endDate: targetDate,
        startTime: '09:00',
        endTime: '17:00',
        appointmentDuration: 30,
        consultationType: 'both',
        isActive: true
      });
      await schedule.save();
      
      res.json({
        success: true,
        message: 'Date marked as available',
        data: { type: 'schedule', availability: schedule }
      });
    } else {
      // No existing entry, create as available
      const schedule = new Availability({
        doctor: doctorId,
        type: 'schedule',
        startDate: targetDate,
        endDate: targetDate,
        startTime: '09:00',
        endTime: '17:00',
        appointmentDuration: 30,
        consultationType: 'both',
        isActive: true
      });
      await schedule.save();
      
      res.json({
        success: true,
        message: 'Date marked as available',
        data: { type: 'schedule', availability: schedule }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling date availability',
      error: error.message
    });
  }
});

export {
  getDoctors,
  getDoctor,
  getDoctorAvailability,
  getMyAvailability,
  createMyAvailability,
  updateMyAvailability,
  deleteMyAvailability,
  generateMonthlyAvailability,
  toggleDateAvailability
};

