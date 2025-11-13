import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ENV } from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';

const patientRegisterSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
    .min(6, 'Password must be at least 6 characters'),
  role: z.literal('patient'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const doctorRegisterSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name must contain only letters and spaces'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name must contain only letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }),
  specialization: z.string()
    .min(2, 'Specialization must be at least 2 characters')
    .trim(),
  experience: z.string()
    .regex(/^\d+$/, 'Experience must be a number')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0 && num <= 50;
    }, 'Experience must be between 0 and 50 years'),
  qualification: z.string()
    .min(2, 'Qualification must be at least 2 characters')
    .trim(),
  location: z.string()
    .min(2, 'Location must be at least 2 characters')
    .trim(),
  licenseNo: z.string()
    .optional()
    .or(z.literal('')),
  clinicHospitalType: z.enum(['clinic', 'hospital'], {
    errorMap: () => ({ message: 'Please select clinic or hospital' }),
  }),
  clinicHospitalName: z.string()
    .min(2, 'Clinic/Hospital name must be at least 2 characters')
    .trim(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
    .min(6, 'Password must be at least 6 characters'),
  role: z.literal('doctor'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const register = asyncHandler(async (req, res) => {
  const isDoctor = req.body.role === 'doctor';
  const schema = isDoctor ? doctorRegisterSchema : patientRegisterSchema;

  // Validate input data
  const validationResult = schema.safeParse(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      message: validationResult.error.errors
    });
  }
  
  const validatedData = validationResult.data;
  
  // Remove confirmPassword from userData
  const { confirmPassword, ...userData } = validatedData;

  // Ensure email is normalized (lowercase and trimmed) - double check
  userData.email = validatedData.email.toLowerCase().trim();

  // Set name based on role
  if (isDoctor) {
    userData.name = `${validatedData.firstName} ${validatedData.lastName}`;
    // Doctors need admin approval - set isApproved to false
    userData.isApproved = false;
  } else {
    userData.name = validatedData.fullName;
    // Patients are auto-approved
    userData.isApproved = true;
  }

  // Check if user already exists with normalized email
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    return res.status(400).json({ 
      success: false,
      message: 'An account with this email already exists. Please try logging in instead.' 
    });
  }

  const user = new User(userData);
  await user.save();

  // Create notification for admin when patient or doctor registers
  try {
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      const notification = new Notification({
        user: admin._id,
        type: isDoctor ? 'doctor_registered' : 'patient_registered',
        message: isDoctor 
          ? `New doctor ${user.name} has registered and is pending approval`
          : `New patient ${user.name} has registered`,
        link: isDoctor ? `/admin/doctors?status=pending` : `/admin/patients`,
        relatedUser: user._id
      });
      await notification.save();
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't fail registration if notification fails
  }

  // For doctors, don't generate token - they need approval first
  if (isDoctor) {
    return res.status(201).json({
      message: 'Registration successful! Your account is pending admin approval. You will be able to login once approved.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: false,
      },
    });
  }

  // For patients, generate token and allow immediate login
  const token = jwt.sign({ userId: user._id }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    message: 'User registered successfully',
    token: token, // Also return token in response body for frontend to store
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: true,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  // Validate input data
  const validationResult = loginSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      message: validationResult.error.errors
    });
  }
  
  const { email, password, rememberMe } = validationResult.data;

  // Normalize email for lookup (lowercase and trim)
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid email or password. Please check your credentials and try again.' 
    });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid email or password. Please check your credentials and try again.' 
    });
  }

  // Check if doctor is approved (only for doctors)
  if (user.role === 'doctor' && !user.isApproved) {
    // Check if doctor was rejected
    if (user.rejectionReason) {
      return res.status(403).json({ 
        success: false,
        message: 'Your doctor registration has been rejected by the admin.',
        rejectionReason: user.rejectionReason,
        isRejected: true
      });
    }
    // Doctor is pending approval
    return res.status(403).json({ 
      success: false,
      message: 'Your account is pending admin approval. You will be able to login once your account is approved.',
      isPending: true
    });
  }

  // Set token expiration based on rememberMe
  const tokenExpiration = rememberMe ? '30d' : ENV.JWT_EXPIRES_IN;
  const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days

  const token = jwt.sign({ userId: user._id }, ENV.JWT_SECRET, {
    expiresIn: tokenExpiration,
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: cookieMaxAge,
  });

  // Check if this is a doctor who was just approved (has approvedAt timestamp)
  let approvalMessage = null;
  if (user.role === 'doctor' && user.isApproved && user.approvedAt) {
    const approvalDate = new Date(user.approvedAt);
    const daysSinceApproval = Math.floor((Date.now() - approvalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Show approval message if approved within last 7 days (recent approval)
    if (daysSinceApproval <= 7) {
      approvalMessage = 'Your doctor account has been approved! You can now access all features of the platform.';
    }
  }

  res.json({
    message: approvalMessage || 'Login successful',
    token: token, // Also return token in response body for frontend to store
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    approvalMessage: approvalMessage, // Include approval message separately for frontend handling
  });
});

const logout = asyncHandler(async (req, res) => {
  // Clear the JWT cookie
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Expire immediately
  });

  res.json({
    message: 'Logout successful',
  });
});

export {
  register,
  login,
  logout,
};