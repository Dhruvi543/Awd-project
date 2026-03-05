import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Availability from '../models/Availability.js';
import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import { verifyPaymentSignature, processRefund } from './payment.controller.js';

// Helper function to compare ObjectIds reliably
const compareObjectIds = (id1, id2) => {
  // Handle populated objects (if id is an object with _id property)
  const getId1 = id1?._id ? id1._id : id1;
  const getId2 = id2?._id ? id2._id : id2;
  
  // Convert both to ObjectId instances
  const objId1 = new mongoose.Types.ObjectId(getId1);
  const objId2 = new mongoose.Types.ObjectId(getId2);
  
  // Use Mongoose equals method for reliable comparison
  return objId1.equals(objId2);
};

// Helper function to check if a date falls within any active leave period
const isDateOnLeave = async (doctorId, checkDate) => {
  try {
    // Normalize the check date to start of day for comparison
    const checkDateStart = new Date(checkDate);
    checkDateStart.setHours(0, 0, 0, 0);
    
    // Find all active leave records for this doctor
    const leaves = await Availability.find({
      doctor: doctorId,
      type: 'leave',
      isActive: true
    });
    
    // Check if the date falls within any leave period
    for (const leave of leaves) {
      if (leave.startDate && leave.endDate) {
        const startDate = new Date(leave.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(leave.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        if (checkDateStart >= startDate && checkDateStart <= endDate) {
          return {
            isOnLeave: true,
            leave: leave
          };
        }
      }
    }
    
    return { isOnLeave: false };
  } catch (error) {
    console.error('Error checking leave status:', error);
    throw new Error('Failed to verify doctor leave status');
  }
};

// Get patient's appointments
const getPatientAppointments = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user._id;
    const { status, filter } = req.query;
    
    let query = { patient: patientId };
    
    // Filter by status (pending, completed, confirmed, cancelled)
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by date (upcoming, past)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (filter === 'upcoming') {
      query.appointmentDate = { $gte: now };
      // For upcoming, exclude cancelled appointments
      if (!query.status) {
        query.status = { $ne: 'cancelled' };
      }
    } else if (filter === 'past') {
      query.appointmentDate = { $lt: now };
    }
    
    const appointments = await Appointment.find(query)
      .populate('doctor', 'name email specialization')
      .sort({ appointmentDate: -1 });
    
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Book an appointment
const bookAppointment = asyncHandler(async (req, res) => {
  try {
    console.log('Book appointment request:', { body: req.body, user: req.user?._id });
    
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can book appointments'
      });
    }

    const patientId = req.user._id;
    const { 
      doctorId, 
      appointmentDate, 
      startTime, 
      endTime, 
      consultationNotes,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature 
    } = req.body;
    
    // Validate required fields
    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, appointment date, start time, and end time are required'
      });
    }

    // Verify payment signature
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Missing Razorpay parameters.'
      });
    }

    const isSignatureValid = verifyPaymentSignature(
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.'
      });
    }
    
    // Check if doctor exists and is approved
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    if (!doctor.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not approved yet'
      });
    }
    
    // Parse appointment date and time
    let appointmentDateTime;
    try {
      // Handle date format - ensure proper parsing
      const dateStr = appointmentDate.includes('T') ? appointmentDate.split('T')[0] : appointmentDate;
      appointmentDateTime = new Date(`${dateStr}T${startTime}:00`);
      
      if (isNaN(appointmentDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment date or time format'
        });
      }
    } catch (dateError) {
      console.error('Date parsing error:', dateError);
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date or time format'
      });
    }
    
    const now = new Date();
    
    if (appointmentDateTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date and time must be in the future'
      });
    }
    
    // Check if appointment is at least 24 hours in advance
    const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);
    if (hoursDifference < 24) {
      return res.status(400).json({
        success: false,
        message: 'Appointments must be booked at least 24 hours in advance'
      });
    }
    
    // Check if appointment is not more than 30 days in advance
    const daysDifference = (appointmentDateTime - now) / (1000 * 60 * 60 * 24);
    if (daysDifference > 30) {
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be booked up to 30 days in advance'
      });
    }
    
    // Check if the appointment date is a Sunday (day 0)
    const appointmentDay = appointmentDateTime.getDay();
    if (appointmentDay === 0) {
      return res.status(400).json({
        success: false,
        message: 'Appointments cannot be booked on Sundays. Please select another day.'
      });
    }
    
    // Validate appointment time is within working hours
    const settings = await Setting.getSettings();
    const workingHoursStart = settings.workingHoursStart || '09:00';
    const workingHoursEnd = settings.workingHoursEnd || '17:00';
    
    // Parse working hours
    const [startHour, startMinute] = workingHoursStart.split(':').map(Number);
    const [endHour, endMinute] = workingHoursEnd.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Parse appointment time
    const [apptHour, apptMinute] = startTime.split(':').map(Number);
    const [apptEndHour, apptEndMinute] = endTime.split(':').map(Number);
    const apptStartMinutes = apptHour * 60 + apptMinute;
    const apptEndMinutes = apptEndHour * 60 + apptEndMinute;
    
    // Check if appointment start time is within working hours
    if (apptStartMinutes < startMinutes || apptStartMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointment start time must be between ${workingHoursStart} and ${workingHoursEnd}`
      });
    }
    
    // Check if appointment end time is within working hours
    if (apptEndMinutes <= startMinutes || apptEndMinutes > endMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointment end time must be between ${workingHoursStart} and ${workingHoursEnd}`
      });
    }
    
    // Check if appointment doesn't extend beyond working hours
    if (apptEndMinutes > endMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointment cannot extend beyond working hours (${workingHoursEnd})`
      });
    }
    
    // Transaction for creation to avoid race conditions
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check max appointments per day for the doctor
      const maxAppointmentsPerDay = settings.maxAppointmentsPerDay || 10;
      const appointmentsCount = await Appointment.countDocuments({
        doctor: doctorId,
        appointmentDate: new Date(appointmentDate),
        status: { $in: ['pending', 'confirmed'] }
      }).session(session);
      
      if (appointmentsCount >= maxAppointmentsPerDay) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Doctor has reached the maximum appointments per day (${maxAppointmentsPerDay}). Please select another date.`
        });
      }
      
      // Check if doctor is on leave on the requested date
      const leaveCheck = await isDateOnLeave(doctorId, appointmentDate);
      if (leaveCheck.isOnLeave) {
        await session.abortTransaction();
        session.endSession();
        const leaveStart = new Date(leaveCheck.leave.startDate).toLocaleDateString();
        const leaveEnd = new Date(leaveCheck.leave.endDate).toLocaleDateString();
        return res.status(400).json({
          success: false,
          message: `Doctor is on leave from ${leaveStart} to ${leaveEnd}. Please select another date.`
        });
      }
      
      // Check for conflicting appointments - prevent duplicate time slots
      const conflictingAppointment = await Appointment.findOne({
        doctor: doctorId,
        appointmentDate: new Date(appointmentDate),
        startTime: startTime,
        status: { $in: ['pending', 'confirmed'] }
      }).session(session);
      
      if (conflictingAppointment) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `This time slot (${startTime} - ${endTime}) is already booked. Please select another time.`
        });
      }
      
      // Also check if patient already has an appointment at this time
      const patientConflict = await Appointment.findOne({
        patient: patientId,
        appointmentDate: new Date(appointmentDate),
        startTime: startTime,
        status: { $in: ['pending', 'confirmed'] }
      }).session(session);
      
      if (patientConflict) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'You already have an appointment at this time. Please select another time slot.'
        });
      }
      
      // Calculate fees
      const doctorConsultationFee = doctor.consultationFee || 500;
      const bookingFee = settings.bookingFee || 100;
      const amountPending = Math.max(0, doctorConsultationFee - bookingFee);

      // Create appointment
      const appointment = new Appointment({
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        consultationNotes,
        status: 'pending',
        paymentStatus: 'completed', // Booking fee paid
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        totalAmount: doctorConsultationFee,
        amountPaid: bookingFee,
        amountPending: amountPending
      });
      
      await appointment.save({ session });
      await session.commitTransaction();
      session.endSession();
      
      // Populate fields after commit
      await appointment.populate('doctor', 'name email specialization');
      await appointment.populate('patient', 'name email');
      
      // Create notification for doctor - appointment request
      try {
        const doctorNotification = new Notification({
          user: doctorId,
          type: 'appointment_request',
          message: `New appointment request from ${req.user.name}`,
          link: `/doctor/appointments`,
          relatedUser: patientId,
          relatedAppointment: appointment._id
        });
        await doctorNotification.save();
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the appointment if notification fails
      }

      // Payment notification for patient
      try {
        const patientPaymentNotif = new Notification({
          user: patientId,
          type: 'payment_received',
          message: `Payment of ₹${bookingFee} received. Your appointment with Dr. ${doctor.name} is awaiting confirmation.`,
          link: `/patient/appointments`,
          relatedAppointment: appointment._id
        });
        await patientPaymentNotif.save();
      } catch (notifError) {
        console.error('Error creating patient payment notification:', notifError);
      }

      // Payment notification for doctor
      try {
        const appointmentDateFormatted = new Date(appointmentDate).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        const doctorPaymentNotif = new Notification({
          user: doctorId,
          type: 'payment_received',
          message: `New paid appointment request from ${req.user.name} for ${appointmentDateFormatted}.`,
          link: `/doctor/appointments`,
          relatedUser: patientId,
          relatedAppointment: appointment._id
        });
        await doctorPaymentNotif.save();
      } catch (notifError) {
        console.error('Error creating doctor payment notification:', notifError);
      }
      
      console.log('Appointment created successfully:', appointment._id);
      
      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: appointment
      });
      
    } catch (transactionError) {
        await session.abortTransaction();
        session.endSession();
        throw transactionError;
    }
    
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
});

// Update appointment (for patients - change date/time)
const updatePatientAppointment = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user._id;
    const appointmentId = req.params.id;
    const { appointmentDate, startTime, endTime, consultationNotes, reason } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment belongs to patient
    if (!compareObjectIds(appointment.patient, patientId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own appointments'
      });
    }
    
    // Only allow updating pending appointments
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending appointments can be updated. Please cancel and book a new appointment if it\'s already confirmed.'
      });
    }
    
    // Validate required fields if updating date/time
    if (appointmentDate || startTime || endTime) {
      if (!appointmentDate || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Appointment date, start time, and end time are all required when updating schedule'
        });
      }
      
      // Parse appointment date and time
      let appointmentDateTime;
      try {
        const dateStr = appointmentDate.includes('T') ? appointmentDate.split('T')[0] : appointmentDate;
        appointmentDateTime = new Date(`${dateStr}T${startTime}:00`);
        
        if (isNaN(appointmentDateTime.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid appointment date or time format'
          });
        }
      } catch (dateError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment date or time format'
        });
      }
      
      const now = new Date();
      const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);
      
      // Check if appointment is at least 24 hours in advance
      if (hoursDifference < 24) {
        return res.status(400).json({
          success: false,
          message: 'Appointments must be booked at least 24 hours in advance'
        });
      }
      
      // Check if appointment is not more than 30 days in advance
      const daysDifference = (appointmentDateTime - now) / (1000 * 60 * 60 * 24);
      if (daysDifference > 30) {
        return res.status(400).json({
          success: false,
          message: 'Appointments can only be booked up to 30 days in advance'
        });
      }
      
      // Check if the appointment date is a Sunday (day 0)
      const appointmentDay = appointmentDateTime.getDay();
      if (appointmentDay === 0) {
        return res.status(400).json({
          success: false,
          message: 'Appointments cannot be booked on Sundays. Please select another day.'
        });
      }
      
      // Validate appointment time is within working hours
      const settings = await Setting.getSettings();
      const workingHoursStart = settings.workingHoursStart || '09:00';
      const workingHoursEnd = settings.workingHoursEnd || '17:00';
      
      // Parse working hours
      const [startHour, startMinute] = workingHoursStart.split(':').map(Number);
      const [endHour, endMinute] = workingHoursEnd.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // Parse appointment time
      const [apptHour, apptMinute] = startTime.split(':').map(Number);
      const [apptEndHour, apptEndMinute] = endTime.split(':').map(Number);
      const apptStartMinutes = apptHour * 60 + apptMinute;
      const apptEndMinutes = apptEndHour * 60 + apptEndMinute;
      
      // Check if appointment start time is within working hours
      if (apptStartMinutes < startMinutes || apptStartMinutes >= endMinutes) {
        return res.status(400).json({
          success: false,
          message: `Appointment start time must be between ${workingHoursStart} and ${workingHoursEnd}`
        });
      }
      
      // Check if appointment end time is within working hours
      if (apptEndMinutes <= startMinutes || apptEndMinutes > endMinutes) {
        return res.status(400).json({
          success: false,
          message: `Appointment end time must be between ${workingHoursStart} and ${workingHoursEnd}`
        });
      }
      
      // Check if appointment doesn't extend beyond working hours
      if (apptEndMinutes > endMinutes) {
        return res.status(400).json({
          success: false,
          message: `Appointment cannot extend beyond working hours (${workingHoursEnd})`
        });
      }
      
      // Check max appointments per day for the doctor
      const maxAppointmentsPerDay = settings.maxAppointmentsPerDay || 10;
      const appointmentsCount = await Appointment.countDocuments({
        doctor: appointment.doctor,
        appointmentDate: new Date(appointmentDate),
        status: { $in: ['pending', 'confirmed'] }
      });
      
      // Don't count the current appointment being updated
      const currentAppointmentCount = await Appointment.countDocuments({
        doctor: appointment.doctor,
        appointmentDate: new Date(appointmentDate),
        status: { $in: ['pending', 'confirmed'] },
        _id: { $ne: appointmentId }
      });
      
      if (currentAppointmentCount >= maxAppointmentsPerDay) {
        return res.status(400).json({
          success: false,
          message: `Doctor has reached the maximum appointments per day (${maxAppointmentsPerDay}). Please select another date.`
        });
      }
      
      // Check if doctor is on leave on the requested date
      const leaveCheck = await isDateOnLeave(appointment.doctor, appointmentDate);
      if (leaveCheck.isOnLeave) {
        const leaveStart = new Date(leaveCheck.leave.startDate).toLocaleDateString();
        const leaveEnd = new Date(leaveCheck.leave.endDate).toLocaleDateString();
        return res.status(400).json({
          success: false,
          message: `Doctor is on leave from ${leaveStart} to ${leaveEnd}. Please select another date.`
        });
      }
      
      // Check for conflicting appointments (excluding current appointment)
      const conflictingAppointment = await Appointment.findOne({
        doctor: appointment.doctor,
        appointmentDate: new Date(appointmentDate),
        startTime: startTime,
        status: { $in: ['pending', 'confirmed'] },
        _id: { $ne: appointmentId }
      });
      
      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: `This time slot (${startTime} - ${endTime}) is already booked. Please select another time.`
        });
      }
      
      // Update date and time
      appointment.appointmentDate = new Date(appointmentDate);
      appointment.startTime = startTime;
      appointment.endTime = endTime;
    }
    
    // Update consultation notes if provided
    if (consultationNotes !== undefined) {
      appointment.consultationNotes = consultationNotes;
    }
    
    // Update reason if provided (store in consultationNotes)
    if (reason !== undefined && reason.trim() !== '') {
      appointment.consultationNotes = reason;
    }
    
    await appointment.save();
    await appointment.populate('doctor', 'name email specialization');
    await appointment.populate('patient', 'name email');
    
    // Create notification for doctor about the update
    try {
      const doctorNotification = new Notification({
        user: appointment.doctor,
        type: 'appointment_updated',
        message: `Appointment updated by ${req.user.name}`,
        link: `/doctor/appointments`,
        relatedUser: patientId,
        relatedAppointment: appointment._id
      });
      await doctorNotification.save();
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
});

// Delete appointment (for patients)
const deletePatientAppointment = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user._id;
    const appointmentId = req.params.id;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment belongs to patient
    if (!compareObjectIds(appointment.patient, patientId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own appointments'
      });
    }
    
    // Only allow deleting pending appointments
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending appointments can be deleted. Please cancel confirmed appointments instead.'
      });
    }
    
    // Create notification for doctor before deleting
    try {
      const doctorNotification = new Notification({
        user: appointment.doctor,
        type: 'appointment_deleted',
        message: `Appointment deleted by ${req.user.name}`,
        link: `/doctor/appointments`,
        relatedUser: patientId
      });
      await doctorNotification.save();
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    await Appointment.deleteOne({ _id: appointmentId });
    
    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: error.message
    });
  }
});

// Cancel an appointment
const cancelAppointment = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user._id;
    const appointmentId = req.params.id;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment belongs to patient - use helper function for reliable ObjectId comparison
    if (!compareObjectIds(appointment.patient, patientId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own appointments'
      });
    }
    
    // Check if appointment can be cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }
    
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment'
      });
    }
    
    // Process refund based on patient cancellation timing policy
    let refundResult = { success: false, refundAmount: 0, reason: 'No payment to refund' };
    if (appointment.paymentStatus === 'completed' && appointment.amountPaid > 0) {
      try {
        refundResult = await processRefund(appointment._id, 'patient');
        console.log('Patient cancel refund result:', refundResult);
      } catch (refundError) {
        console.error('Refund processing error during patient cancel:', refundError);
        // Continue with cancellation even if refund fails
      }
    }

    // If refund didn't already set status to cancelled, do it now
    if (appointment.status !== 'cancelled') {
      appointment.status = 'cancelled';
      appointment.cancellationSource = 'patient';
      await appointment.save();
    }
    
    // Create notification for doctor
    const doctorNotification = new Notification({
      user: appointment.doctor,
      type: 'appointment_cancelled',
      message: `Appointment cancelled by ${req.user.name}`,
      link: `/doctor/appointments`,
      relatedUser: patientId,
      relatedAppointment: appointment._id
    });
    await doctorNotification.save();
    
    // Reload to get updated payment fields
    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name email specialization')
      .populate('patient', 'name email');

    res.json({
      success: true,
      message: refundResult.refundAmount > 0
        ? `Appointment cancelled. Refund of ₹${refundResult.refundAmount} initiated. ${refundResult.reason}`
        : `Appointment cancelled. ${refundResult.reason}`,
      data: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
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
    
    // Get both schedules and leaves
    const availability = await Availability.find({
      doctor: doctorId,
      isActive: true
    }).sort({ type: 1, dayOfWeek: 1, startTime: 1, startDate: 1 });
    
    // Separate schedules and leaves for better frontend handling
    const schedules = availability.filter(a => a.type === 'schedule');
    const leaves = availability.filter(a => a.type === 'leave');
    
    res.json({
      success: true,
      data: availability,
      schedules: schedules,
      leaves: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor availability',
      error: error.message
    });
  }
});

// Get doctor's appointments
const getDoctorAppointments = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { status, filter } = req.query;
    
    let query = { doctor: doctorId };
    
    // Filter by status
    if (status && status !== 'all') {
      if (status === 'confirmed' || status === 'scheduled') {
        query.status = 'confirmed';
      } else {
        query.status = status;
      }
    }
    
    // Filter by date (upcoming, past)
    if (filter === 'upcoming') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $ne: 'cancelled' };
    } else if (filter === 'past') {
      query.appointmentDate = { $lt: new Date() };
    }
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: -1 });
    
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Confirm appointment (doctor)
const confirmAppointment = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const appointmentId = req.params.id;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment belongs to doctor
    if (!compareObjectIds(appointment.doctor, doctorId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only confirm your own appointments'
      });
    }
    
    // Check if appointment can be confirmed
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm appointment with status: ${appointment.status}`
      });
    }
    
    appointment.status = 'confirmed';
    await appointment.save();
    await appointment.populate('patient', 'name email');
    await appointment.populate('doctor', 'name email specialization');
    
    // Create notification for patient
    try {
      const patientNotification = new Notification({
        user: appointment.patient._id,
        type: 'appointment_confirmed',
        message: `Your appointment with Dr. ${appointment.doctor.name} has been confirmed`,
        link: `/patient/appointments`,
        relatedUser: doctorId,
        relatedAppointment: appointment._id
      });
      await patientNotification.save();
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming appointment',
      error: error.message
    });
  }
});

// Reject appointment (doctor)
const rejectAppointment = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const appointmentId = req.params.id;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment belongs to doctor
    if (!compareObjectIds(appointment.doctor, doctorId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject your own appointments'
      });
    }
    
    // Check if appointment can be rejected
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject appointment with status: ${appointment.status}`
      });
    }
    
    appointment.status = 'cancelled';
    appointment.rejectionReason = rejectionReason.trim();
    await appointment.save();
    await appointment.populate('patient', 'name email');
    await appointment.populate('doctor', 'name email specialization');

    // Auto-refund: doctor rejected → 100% refund
    let refundResult = { refundAmount: 0 };
    if (appointment.paymentStatus === 'completed' && appointment.amountPaid > 0) {
      try {
        refundResult = await processRefund(appointment._id, 'doctor');
        console.log('Doctor reject auto-refund result:', refundResult);
      } catch (refundError) {
        console.error('Refund error during doctor reject:', refundError);
      }
    }
    
    // Create notification for patient
    try {
      const patientNotification = new Notification({
        user: appointment.patient._id,
        type: 'appointment_rejected',
        message: `Your appointment with Dr. ${appointment.doctor.name} has been rejected. Reason: ${rejectionReason}`,
        link: `/patient/appointments`,
        relatedUser: doctorId,
        relatedAppointment: appointment._id,
        rejectionReason: rejectionReason.trim()
      });
      await patientNotification.save();
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name email specialization')
      .populate('patient', 'name email');
    
    res.json({
      success: true,
      message: refundResult.refundAmount > 0
        ? `Appointment rejected. Refund of ₹${refundResult.refundAmount} initiated.`
        : 'Appointment rejected successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting appointment',
      error: error.message
    });
  }
});

// Cancel confirmed appointment (doctor)
const cancelConfirmedAppointment = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const appointmentId = req.params.id;
    const { cancellationReason } = req.body;
    
    if (!cancellationReason || cancellationReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment belongs to doctor
    if (!compareObjectIds(appointment.doctor, doctorId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own appointments'
      });
    }
    
    // Check if appointment can be cancelled (must be confirmed)
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel appointment with status: ${appointment.status}. Only confirmed appointments can be cancelled.`
      });
    }
    
    appointment.status = 'cancelled';
    appointment.rejectionReason = cancellationReason.trim();
    await appointment.save();
    await appointment.populate('patient', 'name email');
    await appointment.populate('doctor', 'name email specialization');

    // Auto-refund: doctor cancelled confirmed appointment → 100% refund
    let refundResult = { refundAmount: 0 };
    if (appointment.paymentStatus === 'completed' && appointment.amountPaid > 0) {
      try {
        refundResult = await processRefund(appointment._id, 'doctor');
        console.log('Doctor cancel auto-refund result:', refundResult);
      } catch (refundError) {
        console.error('Refund error during doctor cancel:', refundError);
      }
    }
    
    // Create notification for patient
    try {
      const patientNotification = new Notification({
        user: appointment.patient._id,
        type: 'appointment_cancelled',
        message: `Your confirmed appointment with Dr. ${appointment.doctor.name} has been cancelled. Reason: ${cancellationReason}`,
        link: `/patient/appointments`,
        relatedUser: doctorId,
        relatedAppointment: appointment._id,
        rejectionReason: cancellationReason.trim()
      });
      await patientNotification.save();
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name email specialization')
      .populate('patient', 'name email');
    
    res.json({
      success: true,
      message: refundResult.refundAmount > 0
        ? `Appointment cancelled. Refund of ₹${refundResult.refundAmount} initiated.`
        : 'Appointment cancelled successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
});

// Complete appointment (doctor)
const completeAppointment = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    const appointmentId = req.params.id;
    const { prescription } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if appointment belongs to doctor
    if (!compareObjectIds(appointment.doctor, doctorId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete your own appointments'
      });
    }
    
    // Check if appointment can be completed
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete appointment with status: ${appointment.status}`
      });
    }
    
    appointment.status = 'completed';
    if (prescription) {
      appointment.prescription = prescription;
    }
    await appointment.save();
    await appointment.populate('patient', 'name email');
    await appointment.populate('doctor', 'name email specialization');
    
    // Create notification for patient
    try {
      let message = `Your appointment with Dr. ${appointment.doctor.name} has been completed`;
      if (prescription && prescription.trim()) {
        message += `. Prescription: ${prescription.trim()}`;
      }
      const patientNotification = new Notification({
        user: appointment.patient._id,
        type: 'appointment_completed',
        message: message,
        link: `/patient/appointments`,
        relatedUser: doctorId,
        relatedAppointment: appointment._id
      });
      await patientNotification.save();
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    res.json({
      success: true,
      message: 'Appointment completed successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing appointment',
      error: error.message
    });
  }
});

export {
  getPatientAppointments,
  getDoctorAppointments,
  bookAppointment,
  cancelAppointment,
  updatePatientAppointment,
  deletePatientAppointment,
  confirmAppointment,
  rejectAppointment,
  cancelConfirmedAppointment,
  completeAppointment,
  getDoctorAvailability
};

