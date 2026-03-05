import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Availability from '../models/Availability.js';
import crypto from 'crypto';
import { logLifecycleEvent } from '../utils/auditLogger.js';
import mongoose from 'mongoose';

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .trim()
    .optional(),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .trim()
    .optional(),
  email: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/, 'Email must end with .com (e.g., name@example.com)')
    .toLowerCase()
    .trim()
    .optional(),
  phone: z.string()
    .trim()
    .refine((val) => {
      if (!val || val === '') return true; // Allow empty
      // Remove all non-digit characters for validation
      const digitsOnly = val.replace(/\D/g, '');
      // Must have at least 10 digits and max 15 digits
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    }, {
      message: 'Phone number must contain at least 10 digits and maximum 15 digits'
    })
    .optional()
    .or(z.literal('')), // Allow empty string
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be male, female, or other' })
  }).optional()
    .or(z.literal('')), // Allow empty string
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')), // Allow empty string
  // Doctor-specific fields
  specialization: z.string()
    .min(2, 'Specialization must be at least 2 characters')
    .max(100, 'Specialization must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  experience: z.string()
    .refine((val) => {
      if (!val || val === '') return true; // Allow empty
      const exp = parseInt(val);
      return !isNaN(exp) && exp >= 0 && exp <= 50;
    }, {
      message: 'Experience must be a number between 0 and 50 years'
    })
    .optional()
    .or(z.literal('')),
  qualification: z.string()
    .min(2, 'Qualification must be at least 2 characters')
    .max(200, 'Qualification must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  licenseNo: z.string()
    .regex(/^[A-Z]{2}\/(19|20)\d{2}\/\d{5,6}$/, 'License number must be in format: XX/YYYY/XXXXX (e.g., TN/2020/123456)')
    .trim()
    .optional()
    .or(z.literal('')),
  clinicHospitalType: z.enum(['clinic', 'hospital'], {
    errorMap: () => ({ message: 'Type must be clinic or hospital' })
  }).optional()
    .or(z.literal('')),
  clinicHospitalName: z.string()
    .min(2, 'Clinic/Hospital name must be at least 2 characters')
    .max(200, 'Clinic/Hospital name must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate input data
    const validationResult = updateProfileSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const validatedData = validationResult.data;
    
    // Update name if provided
    if (validatedData.name !== undefined && validatedData.name.trim() !== '') {
      user.name = validatedData.name.trim();
    }

    // Update firstName and lastName for doctors
    if (user.role === 'doctor') {
      if (validatedData.firstName !== undefined) {
        user.firstName = validatedData.firstName.trim() || null;
      }
      if (validatedData.lastName !== undefined) {
        user.lastName = validatedData.lastName.trim() || null;
      }
      // Update name from firstName and lastName if provided
      if (validatedData.firstName !== undefined || validatedData.lastName !== undefined) {
        const firstName = validatedData.firstName?.trim() || user.firstName || '';
        const lastName = validatedData.lastName?.trim() || user.lastName || '';
        if (firstName || lastName) {
          user.name = `${firstName} ${lastName}`.trim();
        }
      }
    }

    // Update email if provided and different
    // Note: Email updates should be handled separately with password verification
    // For now, we'll allow email updates but it's better to have a separate endpoint
    if (validatedData.email !== undefined && validatedData.email.trim() !== '' && validatedData.email !== user.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email: validatedData.email.toLowerCase().trim() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      user.email = validatedData.email.toLowerCase().trim();
    }

    // Update phone if provided (allow empty string to clear)
    if (validatedData.phone !== undefined) {
      const phoneValue = validatedData.phone.trim();
      user.phone = phoneValue === '' ? null : phoneValue;
    }

    // Update gender if provided (allow empty string to clear)
    if (validatedData.gender !== undefined) {
      user.gender = validatedData.gender.trim() || null;
    }

    // Update location if provided (allow empty string to clear)
    if (validatedData.location !== undefined) {
      user.location = validatedData.location.trim() || null;
    }

    // Update doctor-specific fields if user is a doctor
    if (user.role === 'doctor') {
      if (validatedData.specialization !== undefined) {
        user.specialization = validatedData.specialization.trim() || null;
      }
      if (validatedData.experience !== undefined) {
        user.experience = validatedData.experience.trim() || null;
      }
      if (validatedData.qualification !== undefined) {
        user.qualification = validatedData.qualification.trim() || null;
      }
      if (validatedData.licenseNo !== undefined) {
        user.licenseNo = validatedData.licenseNo.trim() || null;
      }
      if (validatedData.clinicHospitalType !== undefined) {
        user.clinicHospitalType = validatedData.clinicHospitalType.trim() || null;
      }
      if (validatedData.clinicHospitalName !== undefined) {
        user.clinicHospitalName = validatedData.clinicHospitalName.trim() || null;
      }
    }

    // Save user - validateBeforeSave ensures schema validation
    // The pre-save hook will skip password hashing since password is not modified
    // We don't need markModified as Mongoose automatically tracks changes
    const savedUser = await user.save({ validateBeforeSave: true });

    // Return updated user data without password
    // Use the saved user object directly to ensure we have the latest data
    const updatedUser = await User.findById(savedUser._id).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found after update'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }
    
    // Update password
    // The pre-save hook will automatically hash the password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
});

// Delete account
const deleteAccount = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ _id: req.user._id, isDeleted: { $ne: true } }).session(session);
    
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'patient') {
      const allAppointments = await Appointment.find({ 
        patient: user._id,
        status: { $in: ['pending', 'confirmed'] }
      }).session(session);
      
      if (allAppointments.length > 0) {
        const bulkOps = allAppointments.map(apt => ({
          updateOne: {
            filter: { _id: apt._id },
            update: {
              $set: { 
                status: 'cancelled',
                rejectionReason: 'Appointment cancelled: Patient account deactivated.',
                cancellationSource: 'system_cascade',
                previousStatus: apt.status
              }
            }
          }
        }));
        await Appointment.bulkWrite(bulkOps, { session });
        console.log(`Cancelled ${allAppointments.length} appointment(s) for deleted patient`);
      }
    } else if (user.role === 'doctor') {
      const allAppointments = await Appointment.find({ 
        doctor: user._id,
        status: { $in: ['pending', 'confirmed'] }
      }).session(session);
      
      if (allAppointments.length > 0) {
         const bulkOps = allAppointments.map(apt => ({
          updateOne: {
            filter: { _id: apt._id },
            update: {
              $set: { 
                status: 'cancelled',
                rejectionReason: 'Appointment cancelled: Doctor account deactivated.',
                cancellationSource: 'system_cascade',
                previousStatus: apt.status
              }
            }
          }
        }));
        await Appointment.bulkWrite(bulkOps, { session });
        console.log(`Cancelled ${allAppointments.length} appointment(s) for deleted doctor`);
      }

      await Review.updateMany(
        { doctor: user._id, isDeleted: { $ne: true } },
        { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: 'system_cascade' } },
        { session }
      );

      await Availability.updateMany(
        { doctor: user._id, isDeleted: { $ne: true } },
        { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: 'system_cascade' } },
        { session }
      );
    }

    // Delete all notifications for this user
    try {
      await Notification.deleteMany({ user: user._id }).session(session);
    } catch (notificationError) {
      console.error('Error deleting notifications:', notificationError);
      // Continue with deletion even if notification deletion fails
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save({ session });
    
    // Post-Delete Operational Assertion
    const verifyUserHidden = await User.findOne({ _id: user._id }).session(session);
    if (verifyUserHidden) {
      throw new Error("Integrity Failure: User remains visible to standard queries.");
    }

    // Role-specific cascade verification
    let activeAppointments = 0;
    if (user.role === 'patient') {
      activeAppointments = await Appointment.countDocuments({ patient: user._id, status: { $in: ['pending', 'confirmed'] } }).session(session);
    } else if (user.role === 'doctor') {
      activeAppointments = await Appointment.countDocuments({ doctor: user._id, status: { $in: ['pending', 'confirmed'] } }).session(session);
    }

    if (activeAppointments > 0) {
      throw new Error(`Integrity Failure: ${activeAppointments} appointments escaped the cascade.`);
    }

    // Calculate approx cascades
    let appointmentsCount = 0;
    if (user.role === 'patient') {
        const checkApts = await Appointment.countDocuments({ patient: user._id, cancellationSource: 'system_cascade' }).session(session);
        appointmentsCount = checkApts;
    } else if (user.role === 'doctor') {
        const checkApts = await Appointment.countDocuments({ doctor: user._id, cancellationSource: 'system_cascade' }).session(session);
        appointmentsCount = checkApts;
    }

    logLifecycleEvent({
      event: "system.user.deleted",
      userId: user._id,
      userRole: user.role,
      actorId: user._id,
      source: "user_self_delete",
      transactionId: crypto.randomUUID(),
      cascadeCounts: {
        appointmentsCancelled: appointmentsCount
      }
    });
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
});

export {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
};

