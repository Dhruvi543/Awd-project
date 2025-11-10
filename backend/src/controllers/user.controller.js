import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  email: z.string()
    .email('Invalid email address')
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

export {
  getProfile,
  updateProfile,
  changePassword
};

