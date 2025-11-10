import { z } from 'zod';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

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

const createReviewSchema = z.object({
  doctor: z.string().min(1, 'Doctor ID is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.union([z.string().max(500, 'Comment must be less than 500 characters'), z.literal('')]).optional(),
});

// Get reviews for a doctor
const getDoctorReviews = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const reviews = await Review.find({ doctor: doctorId })
    .populate('patient', 'name email')
    .populate('appointment')
    .sort({ createdAt: -1 });

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  res.json({
    success: true,
    reviews,
    averageRating: avgRating.toFixed(1),
    totalReviews: reviews.length,
  });
});

// Create a review
const createReview = asyncHandler(async (req, res) => {
  try {
    console.log('Create review request:', { body: req.body, user: req.user?._id });
    
    const validationResult = createReviewSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const reviewData = validationResult.data;
    const patientId = req.user._id;
    
    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log('Review data validated:', reviewData);

    // Check if doctor exists and is approved
    const doctor = await User.findById(reviewData.doctor);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    if (!doctor.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not approved yet',
      });
    }

    // Allow multiple reviews per doctor - no restriction
    // Users can post reviews anytime without limitations

    // Get the most recent appointment (if any) for reference
    const recentAppointment = await Appointment.findOne({
      patient: patientId,
      doctor: reviewData.doctor
    }).sort({ appointmentDate: -1 });

    const review = new Review({
      doctor: reviewData.doctor,
      rating: reviewData.rating,
      comment: reviewData.comment && reviewData.comment.trim() !== '' ? reviewData.comment.trim() : undefined,
      patient: patientId,
      appointment: recentAppointment?._id || null, // Link to appointment if exists, otherwise null
    });

    await review.save();
    await review.populate('patient', 'name email');

    console.log('Review created successfully:', review._id);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
});

// Get patient's reviews
const getPatientReviews = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user._id;
    
    const reviews = await Review.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .populate('appointment')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient reviews',
      error: error.message
    });
  }
});

// Update a review (within 30 minutes)
const updateReview = asyncHandler(async (req, res) => {
  try {
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
        message: 'Only patients can update their own reviews'
      });
    }

    const reviewId = req.params.id;
    const patientId = req.user._id;
    const { rating, comment } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if review belongs to patient - use helper function for reliable ObjectId comparison
    if (!compareObjectIds(review.patient, patientId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }
    
    // Check if review is within 30 minutes
    const reviewDate = new Date(review.createdAt);
    const now = new Date();
    const diffInMinutes = (now - reviewDate) / (1000 * 60);
    
    if (diffInMinutes > 30) {
      return res.status(400).json({
        success: false,
        message: 'Review can only be updated within 30 minutes of posting'
      });
    }
    
    // Update review
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    
    await review.save();
    await review.populate('doctor', 'name specialization');
    await review.populate('patient', 'name email');
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
});

// Delete a review (within 30 minutes)
const deleteReview = asyncHandler(async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is a patient
    if (!req.user.role || req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can delete their own reviews',
        debug: {
          userRole: req.user.role,
          userId: req.user._id
        }
      });
    }

    const reviewId = req.params.id;
    const patientId = req.user._id;
    
    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'Review ID is required'
      });
    }
    
    // Fetch review without populating patient to ensure clean ObjectId comparison
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if review belongs to patient - use helper function for reliable ObjectId comparison
    if (!compareObjectIds(review.patient, patientId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }
    
    // Check if review is within 30 minutes - only allow deletion within this window
    const reviewDate = new Date(review.createdAt);
    const now = new Date();
    const diffInMinutes = (now - reviewDate) / (1000 * 60);
    
    if (diffInMinutes > 30) {
      return res.status(400).json({
        success: false,
        message: 'Review can only be deleted within 30 minutes of posting'
      });
    }
    
    await Review.deleteOne({ _id: reviewId });
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

export {
  getDoctorReviews,
  createReview,
  getPatientReviews,
  updateReview,
  deleteReview,
};

