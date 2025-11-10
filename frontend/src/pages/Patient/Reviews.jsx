import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';
import { useAuth } from '../../contexts/AuthContext';

const PatientReviews = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientReviews, setPatientReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  
  const [editingReview, setEditingReview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(null);
  const [modalMessage, setModalMessage] = useState('Review Posted Successfully!');
  const [isDeleteModal, setIsDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all doctors from the platform
      const doctorsRes = await apiService.getDoctors();
      if (doctorsRes.data.success) {
        setDoctors(doctorsRes.data.data || []);
      }
      
      // Fetch patient's reviews
      const reviewsRes = await apiService.getPatientReviews();
      if (reviewsRes.data.success) {
        setPatientReviews(reviewsRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorSelect = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
    setFormData({ rating: 5, comment: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');

    console.log('Form submitted - handleSubmit called:', { selectedDoctor, formData, isSubmitting });

    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      setError('Please provide a valid rating (1-5)');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Submitting review:', { doctor: selectedDoctor, rating: formData.rating, comment: formData.comment || '' });
      
      const response = await apiService.createReview({
        doctor: selectedDoctor,
        rating: formData.rating,
        comment: formData.comment || ''
      });

      console.log('Review submitted successfully:', response.data);

      if (response.data.success) {
        const review = response.data.review || response.data.data;
        setSubmittedReview(review);
        setModalMessage(response.data.message === 'Review updated successfully' ? 'Review Updated Successfully!' : 'Review Posted Successfully!');
        setShowSuccessModal(true);
        setFormData({ rating: 5, comment: '' });
        setSelectedDoctor('');
        setError('');
        fetchData();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.message || err).join(', ');
        setError(errorMessages);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review._id);
    setEditFormData({
      rating: review.rating,
      comment: review.comment || ''
    });
  };

  const handleUpdate = async (reviewId) => {
    setError('');

    try {
      const response = await apiService.updateReview(reviewId, editFormData);
      if (response.data.success) {
        const review = response.data.data || response.data.review;
        setEditingReview(null);
        setError('');
        setSubmittedReview(review);
        setModalMessage('Review Updated Successfully!');
        setIsDeleteModal(false);
        setShowSuccessModal(true);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating review:', error);
      setError(error.response?.data?.message || 'Failed to update review. Please try again.');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    setError('');

    try {
      const response = await apiService.deleteReview(reviewId);
      if (response.data.success) {
        setError('');
        setModalMessage('Review Deleted Successfully!');
        setIsDeleteModal(true);
        setSubmittedReview(null); // No review object needed for delete
        setShowSuccessModal(true);
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to delete review. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'You are not authenticated. Please login again.';
      } else if (error.response?.status === 403) {
        const responseMessage = error.response?.data?.message || 'Access denied.';
        const debugInfo = error.response?.data?.debug;
        
        // Build detailed error message
        if (debugInfo) {
          if (debugInfo.userRole && debugInfo.userRole !== 'patient') {
            errorMessage = `Access denied. Your role is "${debugInfo.userRole}", but only patients can delete reviews. Please contact support if you believe this is an error.`;
          } else if (debugInfo.reviewPatientId && debugInfo.currentPatientId) {
            errorMessage = `Access denied. This review belongs to a different patient. You can only delete your own reviews.`;
          } else {
            errorMessage = responseMessage;
          }
        } else {
          errorMessage = responseMessage || 'Access denied. You can only delete your own reviews within 30 minutes of posting.';
        }
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Review can only be deleted within 30 minutes of posting.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
  };


  const getTimeRemaining = (review) => {
    const reviewDate = new Date(review.createdAt);
    const now = new Date();
    const diffInMs = (30 * 60 * 1000) - (now - reviewDate);
    
    if (diffInMs <= 0) return null;
    
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);
    
    return { minutes, seconds };
  };

  const CountdownTimer = ({ review, simple = false }) => {
    const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(review));

    useEffect(() => {
      if (!timeRemaining) return;

      const interval = setInterval(() => {
        const remaining = getTimeRemaining(review);
        setTimeRemaining(remaining);
        if (!remaining) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [review]);

    if (!timeRemaining) return null;

    if (simple) {
      return (
        <span className="font-medium">
          {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')} remaining
        </span>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">
          {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')} remaining to edit/delete
        </span>
      </div>
    );
  };

  const StarRating = ({ rating, onRatingChange, editable = false, size = 'w-6 h-6' }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => editable && onRatingChange(star)}
            disabled={!editable}
            className={`${editable ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${size}`}
          >
            <svg
              className={`${size} ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600 fill-current'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  // Check if review can be edited or deleted (within 30 minutes)
  const canEditOrDelete = (review) => {
    const reviewDate = new Date(review.createdAt);
    const now = new Date();
    const diffInMinutes = (now - reviewDate) / (1000 * 60);
    return diffInMinutes <= 30;
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reviews & Ratings</h1>
          <p className="text-gray-600 dark:text-gray-400">Share your experience and help others make informed decisions</p>
        </div>

        {/* Error Messages - Only show error, success is shown in modal */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Write Review Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Write a Review
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Doctor Selection with Search */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search & Select Doctor <span className="text-red-500">*</span>
                </label>
              <select
                value={selectedDoctor}
                onChange={handleDoctorSelect}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a doctor...</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No doctors available</p>
              )}
            </div>

            {/* Rating and Review Form */}
            {selectedDoctor && (
              <>
                {/* Doctor Info - Compact */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {doctors.find(d => d._id === selectedDoctor)?.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        Dr. {doctors.find(d => d._id === selectedDoctor)?.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {doctors.find(d => d._id === selectedDoctor)?.specialization}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating - Compact */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={formData.rating}
                      onRatingChange={(rating) => setFormData({ ...formData, rating })}
                      editable={true}
                      size="w-8 h-8"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formData.rating === 1 && 'Poor'}
                      {formData.rating === 2 && 'Fair'}
                      {formData.rating === 3 && 'Good'}
                      {formData.rating === 4 && 'Very Good'}
                      {formData.rating === 5 && 'Excellent'}
                    </span>
                  </div>
                </div>

                {/* Comment - Compact */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Share your experience..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.comment.length}/500 characters
                  </p>
                </div>

                {/* Submit Button - Compact */}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDoctor('');
                      setFormData({ rating: 5, comment: '' });
                      setError('');
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            </form>
          </div>

        {/* My Reviews Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            My Reviews
          </h2>

          {patientReviews.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">You haven't written any reviews yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {patientReviews.map((review) => {
                const canEditOrDeleteReview = canEditOrDelete(review);
                const isEditing = editingReview === review._id;

                return (
                <div
                  key={review._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Dr. {review.doctor?.name || 'Unknown Doctor'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {review.doctor?.specialization}
                            </p>
                          </div>
                          <CountdownTimer review={review} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rating
                          </label>
                          <StarRating
                            rating={editFormData.rating}
                            onRatingChange={(rating) => setEditFormData({ ...editFormData, rating })}
                            editable={true}
                            size="w-8 h-8"
                          />
                        </div>
                    <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Review
                          </label>
                          <textarea
                            value={editFormData.comment}
                            onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(review._id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingReview(null)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Compact Review Card */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                Dr. {review.doctor?.name || 'Unknown Doctor'}
                              </h3>
                              {canEditOrDeleteReview && <CountdownTimer review={review} />}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {review.doctor?.specialization}
                            </p>
                            <div className="flex items-center gap-2 mb-1">
                              <StarRating rating={review.rating} editable={false} size="w-4 h-4" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                                {review.comment}
                              </p>
                            )}
                          </div>
                          {/* Action Buttons - Compact */}
                          {canEditOrDeleteReview && (
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleEdit(review)}
                                className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(review._id)}
                                className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                  )}
                </div>
                );
              })}
            </div>
          )}
          </div>
      </div>

      {/* Success Modal - For Post/Update/Delete */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => {
          setShowSuccessModal(false);
          setSubmittedReview(null);
          setIsDeleteModal(false);
          setError('');
          setModalMessage('Review Posted Successfully!');
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in" onClick={(e) => e.stopPropagation()}>
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 ${isDeleteModal ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'} rounded-full flex items-center justify-center`}>
                {isDeleteModal ? (
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
              {modalMessage}
            </h3>

            {/* Message - Only show for post/update, not for delete */}
            {!isDeleteModal && submittedReview && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                        You have 30 minutes to edit or delete your review
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        After 30 minutes, your review will be permanent and cannot be edited or deleted.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time Remaining:
                    </p>
                  </div>
                  <div className="text-center">
                    {submittedReview && submittedReview.createdAt ? (
                      <div className="flex items-center justify-center gap-2 text-xl font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-6 py-3 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <CountdownTimer review={submittedReview} simple={true} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-xl font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-6 py-3 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>30:00 remaining</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSubmittedReview(null);
                  setIsDeleteModal(false);
                  setError('');
                  setModalMessage('Review Posted Successfully!');
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                {isDeleteModal ? 'OK' : 'Got it!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientReviews;
