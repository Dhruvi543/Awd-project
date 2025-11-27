import { z } from 'zod';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
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
  try {
    const { doctorId } = req.params;
    
    // Validate doctorId
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format'
      });
    }

    // Convert to ObjectId for reliable querying
    const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
    console.log('Fetching reviews for doctor ID:', doctorId, 'ObjectId:', doctorObjectId);

    // Query reviews with proper ObjectId conversion
    // Reviews are based on experience, not tied to appointments
    const reviews = await Review.find({ doctor: doctorObjectId })
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 });

    console.log('Reviews found for doctor:', reviews.length);
    if (reviews.length > 0) {
      console.log('Sample review:', {
        id: reviews[0]._id,
        doctor: reviews[0].doctor,
        patient: reviews[0].patient?.name,
        rating: reviews[0].rating,
        comment: reviews[0].comment
      });
    } else {
      // Debug: Check if there are any reviews in the database for this doctor
      const allReviewsForDoctor = await Review.find({ doctor: doctorObjectId }).lean();
      console.log('Raw reviews query result (without populate):', allReviewsForDoctor.length);
      if (allReviewsForDoctor.length > 0) {
        console.log('Raw review doctor field:', allReviewsForDoctor[0].doctor);
        console.log('Doctor ObjectId:', doctorObjectId.toString());
        console.log('Match:', allReviewsForDoctor[0].doctor.toString() === doctorObjectId.toString());
      }
    }

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    res.json({
      success: true,
      data: reviews,
      reviews, // Keep for backward compatibility
      averageRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error fetching doctor reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor reviews',
      error: error.message
    });
  }
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

    // Validate and convert doctor ID to ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewData.doctor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format',
      });
    }

    const doctorObjectId = new mongoose.Types.ObjectId(reviewData.doctor);
    console.log('Doctor ID converted to ObjectId:', doctorObjectId.toString());

    // Check if doctor exists and is approved
    const doctor = await User.findById(doctorObjectId);
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

    // Check if patient has a completed appointment with this doctor
    const completedAppointment = await Appointment.findOne({
      patient: patientId,
      doctor: doctorObjectId,
      status: 'completed'
    }).sort({ appointmentDate: -1 }); // Get the most recent completed appointment

    if (!completedAppointment) {
      return res.status(400).json({
        success: false,
        message: 'You can only review doctors with whom you have completed an appointment',
      });
    }

    // Check if patient has already reviewed this doctor
    const existingReview = await Review.findOne({
      patient: patientId,
      doctor: doctorObjectId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this doctor. You can only write one review per doctor.',
      });
    }

    const review = new Review({
      doctor: doctorObjectId,
      rating: reviewData.rating,
      comment: reviewData.comment && reviewData.comment.trim() !== '' ? reviewData.comment.trim() : undefined,
      patient: patientId,
      appointment: completedAppointment._id, // Link to the most recent completed appointment
    });

    await review.save();
    await review.populate('patient', 'name email');
    await review.populate('doctor', 'name');

    console.log('Review created successfully:', {
      reviewId: review._id,
      doctor: review.doctor?._id || review.doctor,
      doctorName: review.doctor?.name,
      patient: review.patient?._id || review.patient,
      rating: review.rating
    });

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

