import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Availability from '../models/Availability.js';
import Notification from '../models/Notification.js';

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

// Get patient's appointments
const getPatientAppointments = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user._id;
    const { status, filter } = req.query;
    
    let query = { patient: patientId };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by date (upcoming, past)
    if (filter === 'upcoming') {
      query.appointmentDate = { $gte: new Date() };
    } else if (filter === 'past') {
      query.appointmentDate = { $lt: new Date() };
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
    const { doctorId, appointmentDate, startTime, endTime, consultationNotes } = req.body;
    
    // Validate required fields
    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, appointment date, start time, and end time are required'
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
    
    // Check for conflicting appointments - prevent duplicate time slots
    // Check if same doctor, same date, same start time already exists
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      startTime: startTime,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (conflictingAppointment) {
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
    });
    
    if (patientConflict) {
      return res.status(400).json({
        success: false,
        message: 'You already have an appointment at this time. Please select another time slot.'
      });
    }
    
    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      consultationNotes,
      status: 'pending'
    });
    
    await appointment.save();
    await appointment.populate('doctor', 'name email specialization');
    await appointment.populate('patient', 'name email');
    
    // Create notification for doctor
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
    
    console.log('Appointment created successfully:', appointment._id);
    
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
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
    
    appointment.status = 'cancelled';
    await appointment.save();
    
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
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
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
    
    const availability = await Availability.find({
      doctor: doctorId,
      isActive: true
    }).sort({ dayOfWeek: 1, startTime: 1 });
    
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

export {
  getPatientAppointments,
  bookAppointment,
  cancelAppointment,
  updatePatientAppointment,
  deletePatientAppointment,
  getDoctorAvailability
};

