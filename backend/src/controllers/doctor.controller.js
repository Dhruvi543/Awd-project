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
  getDoctors,
  getDoctor,
  getDoctorAvailability
};

