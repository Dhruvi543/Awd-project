import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Availability from '../models/Availability.js';

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
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle related data based on user role
    if (user.role === 'patient') {
      // Cancel ALL appointments for this patient (pending, confirmed, etc.)
      // When patient deletes account, all appointments should be cancelled
      try {
        const allAppointments = await Appointment.find({ 
          patient: user._id,
          status: { $in: ['pending', 'confirmed'] } // Only cancel pending and confirmed, not already completed/cancelled
        });
        
        if (allAppointments.length > 0) {
          await Appointment.updateMany(
            { patient: user._id, status: { $in: ['pending', 'confirmed'] } },
            { 
              status: 'cancelled',
              rejectionReason: 'Appointment cancelled: Patient account has been deleted'
            }
          );
          console.log(`Cancelled ${allAppointments.length} appointment(s) for deleted patient`);
        }
      } catch (appointmentError) {
        console.error('Error cancelling appointments:', appointmentError);
        // Continue with deletion even if appointment cancellation fails
      }

      // Note: Reviews are NOT deleted when patient account is deleted
      // Reviews remain with patient name and doctor name for other patients' reference
    } else if (user.role === 'doctor') {
      // Cancel ALL appointments for this doctor (pending, confirmed, etc.)
      // When doctor deletes account, all appointments should be cancelled
      try {
        const allAppointments = await Appointment.find({ 
          doctor: user._id,
          status: { $in: ['pending', 'confirmed'] } // Only cancel pending and confirmed, not already completed/cancelled
        });
        
        if (allAppointments.length > 0) {
          await Appointment.updateMany(
            { doctor: user._id, status: { $in: ['pending', 'confirmed'] } },
            { 
              status: 'cancelled',
              rejectionReason: 'Appointment cancelled: Doctor account has been deleted'
            }
          );
          console.log(`Cancelled ${allAppointments.length} appointment(s) for deleted doctor`);
        }
      } catch (appointmentError) {
        console.error('Error cancelling appointments:', appointmentError);
        // Continue with deletion even if appointment cancellation fails
      }

      // Delete all reviews for this doctor
      try {
        await Review.deleteMany({ doctor: user._id });
      } catch (reviewError) {
        console.error('Error deleting reviews:', reviewError);
        // Continue with deletion even if review deletion fails
      }

      // Delete all availability for this doctor
      try {
        await Availability.deleteMany({ doctor: user._id });
      } catch (availabilityError) {
        console.error('Error deleting availability:', availabilityError);
        // Continue with deletion even if availability deletion fails
      }
    }

    // Delete all notifications for this user
    try {
      await Notification.deleteMany({ user: user._id });
    } catch (notificationError) {
      console.error('Error deleting notifications:', notificationError);
      // Continue with deletion even if notification deletion fails
    }

    // Delete the user account
    await User.deleteOne({ _id: user._id });
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
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

