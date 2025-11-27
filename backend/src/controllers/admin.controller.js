import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Review from '../models/Review.js';
import Availability from '../models/Availability.js';
import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import bcrypt from 'bcryptjs';

// ==================== DASHBOARD ====================
// Get dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Count total users by role
    // Total users = patients + approved doctors (excluding admins and pending doctors)
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const approvedDoctors = await User.countDocuments({ role: 'doctor', isApproved: true });
    // Explicitly exclude admin role and only count patients + approved doctors
    const totalUsers = totalPatients + approvedDoctors; // Only count patients and approved doctors (excludes admins and pending doctors)
    const pendingDoctors = await User.countDocuments({ role: 'doctor', isApproved: false });
    
    // Debug: Verify counts (can be removed in production)
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log('User counts - Patients:', totalPatients, 'Approved Doctors:', approvedDoctors, 'Pending Doctors:', pendingDoctors, 'Admins:', adminCount, 'Total Users:', totalUsers);
    
    // Count appointments
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    
    // Count today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    // Count reviews
    const totalReviews = await Review.countDocuments();
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalPatients,
        pendingDoctors,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        todayAppointments,
        totalReviews,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// Get recent appointments
const getRecentAppointments = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const appointments = await Appointment.find()
      .populate('patient', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-consultationNotes -prescription');
    
    // Get doctor info from User model
    const formattedAppointments = await Promise.all(
      appointments.map(async (apt) => {
        const doctor = await User.findById(apt.doctor).select('name email');
        
        return {
          _id: apt._id,
          patientName: apt.patient?.name || 'Unknown',
          doctorName: doctor?.name || 'Unknown',
          appointmentDate: apt.appointmentDate,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: apt.status,
          createdAt: apt.createdAt,
        };
      })
    );
    
    res.json({
      success: true,
      data: formattedAppointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent appointments',
      error: error.message
    });
  }
});

// Get recent users
const getRecentUsers = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-password');
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent users',
      error: error.message
    });
  }
});

// ==================== DOCTORS CRUD ====================
// Get all doctors (VIEW)
const getAllDoctors = asyncHandler(async (req, res) => {
  try {
    const { status, search, specialization, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { role: 'doctor' };
    
    // Filter by approval status
    if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'approved') {
      query.isApproved = true;
    }
    
    // Filter by specialization
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    
    const doctors = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
});

// Get single doctor (VIEW)
const getDoctor = asyncHandler(async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
      .select('-password');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor',
      error: error.message
    });
  }
});

// Create doctor (INSERT)
const createDoctor = asyncHandler(async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      specialization,
      experience,
      qualification,
      location,
      licenseNo,
      clinicHospitalType,
      clinicHospitalName,
      password
    } = req.body;
    
    // Validate email format - only .com extension allowed
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Email must end with .com (e.g., name@example.com)'
        });
      }
    }
    
    // Validate license number format - Pattern: XX/YYYY/XXXXX
    if (licenseNo) {
      const licenseRegex = /^[A-Z]{2}\/(19|20)\d{2}\/\d{5,6}$/;
      if (!licenseRegex.test(licenseNo.trim())) {
        return res.status(400).json({
          success: false,
          message: 'License number must be in format: XX/YYYY/XXXXX (e.g., TN/2020/123456)'
        });
      }
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create doctor user
    const doctor = new User({
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone,
      gender,
      specialization,
      experience,
      qualification,
      location,
      licenseNo: licenseNo?.trim() || '',
      clinicHospitalType,
      clinicHospitalName,
      password,
      role: 'doctor',
      isApproved: true, // Admin created doctors are auto-approved
      approvedAt: new Date(),
      approvedBy: req.user._id
    });
    
    await doctor.save();
    
    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        isApproved: doctor.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating doctor',
      error: error.message
    });
  }
});

// Update doctor (UPDATE)
const updateDoctor = asyncHandler(async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      specialization,
      experience,
      qualification,
      location,
      licenseNo,
      clinicHospitalType,
      clinicHospitalName
    } = req.body;
    
    // Validate email format - only .com extension allowed
    if (email && email !== doctor.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Email must end with .com (e.g., name@example.com)'
        });
      }
      
      // Check if new email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: doctor._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // Validate license number format - Pattern: XX/YYYY/XXXXX
    if (licenseNo !== undefined && licenseNo !== '') {
      const licenseRegex = /^[A-Z]{2}\/(19|20)\d{2}\/\d{5,6}$/;
      if (!licenseRegex.test(licenseNo.trim())) {
        return res.status(400).json({
          success: false,
          message: 'License number must be in format: XX/YYYY/XXXXX (e.g., TN/2020/123456)'
        });
      }
    }
    
    // Update fields
    if (firstName) doctor.firstName = firstName;
    if (lastName) doctor.lastName = lastName;
    if (firstName || lastName) doctor.name = `${firstName || doctor.firstName} ${lastName || doctor.lastName}`;
    if (email) doctor.email = email.toLowerCase().trim();
    if (phone) doctor.phone = phone;
    if (gender) doctor.gender = gender;
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (qualification) doctor.qualification = qualification;
    if (location) doctor.location = location;
    if (licenseNo !== undefined) doctor.licenseNo = licenseNo.trim() || '';
    if (clinicHospitalType) doctor.clinicHospitalType = clinicHospitalType;
    if (clinicHospitalName) doctor.clinicHospitalName = clinicHospitalName;
    
    await doctor.save();
    
    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating doctor',
      error: error.message
    });
  }
});

// Delete doctor (DELETE)
const deleteDoctor = asyncHandler(async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Cancel ALL appointments for this doctor (pending, confirmed, etc.)
    // When doctor is deleted, all appointments should be cancelled
    try {
      const allAppointments = await Appointment.find({ 
        doctor: doctor._id,
        status: { $in: ['pending', 'confirmed'] } // Only cancel pending and confirmed, not already completed/cancelled
      });
      
      if (allAppointments.length > 0) {
        await Appointment.updateMany(
          { doctor: doctor._id, status: { $in: ['pending', 'confirmed'] } },
          { 
            status: 'cancelled',
            rejectionReason: 'Appointment cancelled: Doctor account has been deleted'
          }
        );
        console.log(`Cancelled ${allAppointments.length} appointment(s) for deleted doctor`);
      }
    } catch (appointmentError) {
      console.error('Error cancelling appointments:', appointmentError);
      // Continue with doctor deletion even if appointment cancellation fails
    }

    // Delete all reviews for this doctor
    try {
      await Review.deleteMany({ doctor: doctor._id });
    } catch (reviewError) {
      console.error('Error deleting reviews:', reviewError);
      // Continue with deletion even if review deletion fails
    }

    // Delete all availability for this doctor
    try {
      await Availability.deleteMany({ doctor: doctor._id });
    } catch (availabilityError) {
      console.error('Error deleting availability:', availabilityError);
      // Continue with deletion even if availability deletion fails
    }
    
    await User.deleteOne({ _id: doctor._id });
    
    res.json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting doctor',
      error: error.message
    });
  }
});

// Approve doctor
const approveDoctor = asyncHandler(async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    doctor.isApproved = true;
    doctor.approvedAt = new Date();
    doctor.approvedBy = req.user._id;
    doctor.rejectionReason = undefined;
    
    await doctor.save();
    
    // Create notification for doctor
    try {
      const notification = new Notification({
        user: doctor._id,
        type: 'doctor_approved',
        message: `Your doctor account has been approved! You can now login to the platform.`,
        link: '/doctor/dashboard'
      });
      await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't fail approval if notification fails
    }
    
    res.json({
      success: true,
      message: 'Doctor approved successfully',
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        isApproved: doctor.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving doctor',
      error: error.message
    });
  }
});

// Reject doctor
const rejectDoctor = asyncHandler(async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    doctor.isApproved = false;
    doctor.rejectionReason = rejectionReason || 'Registration rejected by admin';
    
    await doctor.save();
    
    // Create notification for doctor
    try {
      const notification = new Notification({
        user: doctor._id,
        type: 'doctor_rejected',
        message: `Your doctor registration has been rejected. Reason: ${doctor.rejectionReason}`,
        link: '/register'
      });
      await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't fail rejection if notification fails
    }
    
    res.json({
      success: true,
      message: 'Doctor rejected successfully',
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        isApproved: doctor.isApproved,
        rejectionReason: doctor.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting doctor',
      error: error.message
    });
  }
});

// ==================== PATIENTS CRUD ====================
// Get all patients (VIEW)
const getAllPatients = asyncHandler(async (req, res) => {
  try {
    const { search, gender, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { role: 'patient' };
    
    // Filter by gender
    if (gender) {
      query.gender = gender;
    }
    
    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const patients = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
});

// Get single patient (VIEW)
const getPatient = asyncHandler(async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: 'patient' })
      .select('-password');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
});

// Create patient (INSERT)
const createPatient = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, phone, gender } = req.body;
    
    // Validate email format - only .com extension allowed
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Email must end with .com (e.g., name@example.com)'
        });
      }
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create patient user
    const patient = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      phone,
      gender,
      role: 'patient',
      isApproved: true
    });
    
    await patient.save();
    
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        role: patient.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating patient',
      error: error.message
    });
  }
});

// Update patient (UPDATE)
const updatePatient = asyncHandler(async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: 'patient' });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const { name, email, phone, gender } = req.body;
    
    // Validate email format - only .com extension allowed
    if (email && email !== patient.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Email must end with .com (e.g., name@example.com)'
        });
      }
      
      // Check if new email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: patient._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // Update fields
    if (name) patient.name = name;
    if (email) patient.email = email.toLowerCase().trim();
    if (phone) patient.phone = phone;
    if (gender) patient.gender = gender;
    
    await patient.save();
    
    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        role: patient.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message
    });
  }
});

// Delete patient (DELETE)
const deletePatient = asyncHandler(async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: 'patient' });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Cancel ALL appointments for this patient (pending, confirmed, etc.)
    // When patient is deleted, all appointments should be cancelled
    try {
      const allAppointments = await Appointment.find({ 
        patient: patient._id,
        status: { $in: ['pending', 'confirmed'] } // Only cancel pending and confirmed, not already completed/cancelled
      });
      
      if (allAppointments.length > 0) {
        await Appointment.updateMany(
          { patient: patient._id, status: { $in: ['pending', 'confirmed'] } },
          { 
            status: 'cancelled',
            rejectionReason: 'Appointment cancelled: Patient account has been deleted'
          }
        );
        console.log(`Cancelled ${allAppointments.length} appointment(s) for deleted patient`);
      }
    } catch (appointmentError) {
      console.error('Error cancelling appointments:', appointmentError);
      // Continue with patient deletion even if appointment cancellation fails
    }
    
    // Note: Reviews are NOT deleted when patient account is deleted
    // Reviews remain with patient name and doctor name for other patients' reference
    
    const deleteResult = await User.deleteOne({ _id: patient._id });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete patient. No documents were deleted.'
      });
    }
    
    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message
    });
  }
});

// ==================== APPOINTMENTS CRUD ====================
// Get all appointments (VIEW)
const getAllAppointments = asyncHandler(async (req, res) => {
  try {
    const { status, search, dateFilter, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by date range
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query.appointmentDate = { $gte: today, $lt: tomorrow };
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query.appointmentDate = { $gte: weekAgo };
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query.appointmentDate = { $gte: monthAgo };
      }
    }
    
    let appointments = await Appointment.find(query)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Search filter (client-side for now)
    if (search) {
      appointments = appointments.filter(apt => 
        apt.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        apt.doctor?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const total = await Appointment.countDocuments(query);
    
    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Get single appointment (VIEW)
const getAppointment = asyncHandler(async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message
    });
  }
});

// Update appointment (UPDATE)
const updateAppointment = asyncHandler(async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    const { status, appointmentDate, startTime, endTime, consultationNotes, prescription } = req.body;
    
    // Update fields
    if (status) appointment.status = status;
    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (startTime) appointment.startTime = startTime;
    if (endTime) appointment.endTime = endTime;
    if (consultationNotes !== undefined) appointment.consultationNotes = consultationNotes;
    if (prescription !== undefined) appointment.prescription = prescription;
    
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
});

// Delete appointment (DELETE)
const deleteAppointment = asyncHandler(async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    await Appointment.deleteOne({ _id: appointment._id });
    
    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: error.message
    });
  }
});

// ==================== REVIEWS CRUD ====================
// Get all reviews (VIEW)
const getAllReviews = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {};
    
    // Filter by rating
    if (rating) {
      query.rating = parseInt(rating);
    }
    
    let reviews = await Review.find(query)
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization')
      .populate('appointment', 'appointmentDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Search filter (client-side for now, can be moved to backend)
    if (search) {
      reviews = reviews.filter(review => 
        review.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        review.doctor?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const total = await Review.countDocuments(query);
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// Get single review (VIEW)
const getReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email specialization')
      .populate('appointment', 'appointmentDate startTime endTime');
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
});

// Delete review (DELETE)
const deleteReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    await Review.deleteOne({ _id: review._id });
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

// ==================== AVAILABILITY CRUD ====================
// Get all availability (VIEW)
const getAllAvailability = asyncHandler(async (req, res) => {
  try {
    const { doctorId, type, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {};
    if (doctorId) query.doctor = doctorId;
    if (type) query.type = type;
    
    const availability = await Availability.find(query)
      .populate('doctor', 'name email specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Availability.countDocuments(query);
    
    res.json({
      success: true,
      data: availability,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching availability',
      error: error.message
    });
  }
});

// Get single availability (VIEW)
const getAvailability = asyncHandler(async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id)
      .populate('doctor', 'name email specialization');
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found'
      });
    }
    
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

// Create availability (INSERT)
const createAvailability = asyncHandler(async (req, res) => {
  try {
    const { doctor, type, dayOfWeek, startTime, endTime, startDate, endDate, reason } = req.body;
    
    const availability = new Availability({
      doctor,
      type,
      dayOfWeek,
      startTime,
      endTime,
      startDate,
      endDate,
      reason
    });
    
    await availability.save();
    await availability.populate('doctor', 'name email specialization');
    
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

// Update availability (UPDATE)
const updateAvailability = asyncHandler(async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found'
      });
    }
    
    const { type, dayOfWeek, startTime, endTime, startDate, endDate, reason, isActive } = req.body;
    
    if (type) availability.type = type;
    if (dayOfWeek !== undefined) availability.dayOfWeek = dayOfWeek;
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    if (startDate) availability.startDate = startDate;
    if (endDate) availability.endDate = endDate;
    if (reason !== undefined) availability.reason = reason;
    if (isActive !== undefined) availability.isActive = isActive;
    
    await availability.save();
    await availability.populate('doctor', 'name email specialization');
    
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

// Delete availability (DELETE)
const deleteAvailability = asyncHandler(async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found'
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

// ==================== ANALYTICS ====================
// Get analytics data (VIEW)
const getAnalytics = asyncHandler(async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // User growth over time
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Appointments over time
    const appointmentsOverTime = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Reviews by rating
    const reviewsByRating = await Review.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Top doctors by appointments
    const topDoctors = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$doctor',
          appointmentCount: { $sum: 1 }
        }
      },
      { $sort: { appointmentCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Populate doctor names
    const topDoctorsWithNames = await Promise.all(
      topDoctors.map(async (item) => {
        const doctor = await User.findById(item._id).select('name email specialization');
        return {
          doctorId: item._id,
          doctorName: doctor?.name || 'Unknown',
          doctorEmail: doctor?.email || '',
          specialization: doctor?.specialization || '',
          appointmentCount: item.appointmentCount
        };
      })
    );
    
    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Total registered users (all-time, cumulative)
    const totalRegisteredUsers = await User.countDocuments();
    
    // Cumulative user registration over time (all-time, not just period)
    const cumulativeUserGrowth = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Calculate cumulative counts
    let cumulativeCount = 0;
    const cumulativeUserData = cumulativeUserGrowth.map(item => {
      cumulativeCount += item.count;
      return {
        _id: item._id,
        count: cumulativeCount
      };
    });
    
    res.json({
      success: true,
      data: {
        userGrowth,
        appointmentsByStatus,
        appointmentsOverTime,
        reviewsByRating,
        topDoctors: topDoctorsWithNames,
        usersByRole,
        totalRegisteredUsers,
        cumulativeUserGrowth: cumulativeUserData,
        period: days
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

// ==================== SETTINGS ====================
// Get settings (VIEW)
const getSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
});

// Update settings (UPDATE)
const updateSettings = asyncHandler(async (req, res) => {
  try {
    const updates = req.body;
    
    // Validate numeric fields
    if (updates.maxAppointmentsPerDay !== undefined) {
      const maxAppts = parseInt(updates.maxAppointmentsPerDay);
      if (isNaN(maxAppts) || maxAppts < 1 || maxAppts > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Max appointments per day must be between 1 and 1000'
        });
      }
      updates.maxAppointmentsPerDay = maxAppts;
    }
    
    if (updates.appointmentDuration !== undefined) {
      const duration = parseInt(updates.appointmentDuration);
      if (isNaN(duration) || duration < 5 || duration > 480) {
        return res.status(400).json({
          success: false,
          message: 'Appointment duration must be between 5 and 480 minutes'
        });
      }
      updates.appointmentDuration = duration;
    }
    
    if (updates.minPasswordLength !== undefined) {
      const minPass = parseInt(updates.minPasswordLength);
      if (isNaN(minPass) || minPass < 6 || minPass > 20) {
        return res.status(400).json({
          success: false,
          message: 'Minimum password length must be between 6 and 20'
        });
      }
      updates.minPasswordLength = minPass;
    }
    
    if (updates.sessionTimeout !== undefined) {
      const timeout = parseInt(updates.sessionTimeout);
      if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
        return res.status(400).json({
          success: false,
          message: 'Session timeout must be between 5 and 1440 minutes'
        });
      }
      updates.sessionTimeout = timeout;
    }
    
    // Validate required fields
    if (updates.siteName !== undefined && (!updates.siteName || updates.siteName.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Site name is required'
      });
    }
    
    if (updates.siteDescription !== undefined && (!updates.siteDescription || updates.siteDescription.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Site description is required'
      });
    }
    
    // Get or create settings document
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }
    
    // Update all fields from request body
    const allowedFields = [
      'siteName', 'siteDescription',
      'maxAppointmentsPerDay', 'appointmentDuration', 'workingHoursStart', 'workingHoursEnd',
      'minPasswordLength', 'sessionTimeout',
      'maintenanceMode', 'allowRegistration', 'requireEmailVerification', 'autoApproveDoctors'
    ];
    
    allowedFields.forEach(key => {
      if (updates[key] !== undefined) {
        if (settings.schema.paths[key]) {
          // Handle string fields - trim whitespace
          if (typeof updates[key] === 'string') {
            settings[key] = updates[key].trim();
          } else {
            settings[key] = updates[key];
          }
        }
      }
    });
    
    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    
    await settings.save();
    
    console.log('Settings saved to database:', {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription
    });
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
});

// Verify admin password (for two-step verification)
const verifyAdminPassword = asyncHandler(async (req, res) => {
  try {
    const { password } = req.body;
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // Verify current password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password wrong or not match'
      });
    }
    
    res.json({
      success: true,
      message: 'Password verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying password',
      error: error.message
    });
  }
});

// Update admin email (UPDATE)
const updateAdminEmail = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Verify current password is required
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required'
      });
    }
    
    // Verify current password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password wrong or not match'
      });
    }
    
    // Check if email is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email format - only .com extension allowed
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Email must end with .com (e.g., name@example.com)'
      });
    }
    
    // Check if email already exists (only if different from current)
    if (email.toLowerCase().trim() !== admin.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      admin.email = email.toLowerCase().trim();
    }
    
    await admin.save();
    
    res.json({
      success: true,
      message: 'Email updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating email',
      error: error.message
    });
  }
});

// Update admin password (UPDATE)
const updateAdminPassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Validate inputs
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required'
      });
    }
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }
    
    // Verify current password
    const isPasswordValid = await admin.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password wrong or not match'
      });
    }
    
    // Check if new password is same as current
    const isSamePassword = await admin.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }
    
    // Update password
    admin.password = newPassword;
    await admin.save();
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
});

// ==================== NOTIFICATIONS ====================
// Get all notifications for admin (VIEW)
const getNotifications = asyncHandler(async (req, res) => {
  try {
    const { isRead, type, limit = 50 } = req.query;
    
    let query = { user: req.user._id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .populate('relatedUser', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    
    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Mark notification as read (UPDATE)
const markNotificationRead = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read (UPDATE)
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
});

// Delete notification (DELETE)
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await Notification.deleteOne({ _id: notification._id });
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

export {
  // Dashboard
  getDashboardStats,
  getRecentAppointments,
  getRecentUsers,
  // Doctors CRUD
  getAllDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  approveDoctor,
  rejectDoctor,
  // Patients CRUD
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  // Appointments CRUD
  getAllAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  // Reviews CRUD
  getAllReviews,
  getReview,
  deleteReview,
  // Availability CRUD
  getAllAvailability,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  // Analytics
  getAnalytics,
  // Settings
  getSettings,
  updateSettings,
  verifyAdminPassword,
  updateAdminEmail,
  updateAdminPassword,
  // Notifications
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
