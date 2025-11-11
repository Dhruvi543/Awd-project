import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/apiService';

const DoctorReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0,
  });

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      // Handle both id and _id (backend returns id, MongoDB uses _id)
      // This ensures compatibility with existing sessions
      const doctorId = user?._id || user?.id;
      console.log('Fetching reviews for doctor ID:', doctorId);
      console.log('User object:', user);
      
      if (!doctorId) {
        console.error('Doctor ID not found. User object:', user);
        setIsLoading(false);
        return;
      }
      
      const response = await apiService.getDoctorReviews(doctorId);
      console.log('Reviews API Response:', response.data);
      
      if (response.data.success) {
        const reviewsData = response.data.data || response.data.reviews || [];
        console.log('Reviews data received:', reviewsData.length, 'reviews');
        console.log('Sample review:', reviewsData[0]);
        
        setReviews(reviewsData);
        
        // Calculate stats
        const total = reviewsData.length;
        const average = response.data.averageRating 
          ? parseFloat(response.data.averageRating)
          : (total > 0 
            ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / total 
            : 0);
        
        const ratingCounts = response.data.ratingDistribution || {
          5: reviewsData.filter(r => r.rating === 5).length,
          4: reviewsData.filter(r => r.rating === 4).length,
          3: reviewsData.filter(r => r.rating === 3).length,
          2: reviewsData.filter(r => r.rating === 2).length,
          1: reviewsData.filter(r => r.rating === 1).length,
        };
        
        setStats({
          totalReviews: total,
          averageRating: parseFloat(average.toFixed(1)),
          fiveStar: ratingCounts[5] || 0,
          fourStar: ratingCounts[4] || 0,
          threeStar: ratingCounts[3] || 0,
          twoStar: ratingCounts[2] || 0,
          oneStar: ratingCounts[1] || 0,
        });
      } else {
        console.error('API returned success: false', response.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch if user is available
    if (user) {
      fetchReviews();
    }
  }, [user, fetchReviews]);

  useEffect(() => {
    filterAndSortReviews();
  }, [reviews, searchQuery, ratingFilter, sortBy]);

  const filterAndSortReviews = () => {
    let filtered = [...reviews];

    // Filter by rating
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(review => 
        review.patient?.name?.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query) ||
        review.patient?.email?.toLowerCase().includes(query)
      );
    }

    // Sort reviews with proper handling and secondary sorting for ties
    filtered.sort((a, b) => {
      let primarySort = 0;
      
      switch (sortBy) {
        case 'newest':
          // Sort by date descending (newest first)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          primarySort = dateB - dateA;
          // If dates are equal, sort by rating descending as secondary sort
          if (primarySort === 0) {
            return (b.rating || 0) - (a.rating || 0);
          }
          return primarySort;
          
        case 'oldest':
          // Sort by date ascending (oldest first)
          const dateAOld = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateBOld = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          primarySort = dateAOld - dateBOld;
          // If dates are equal, sort by rating ascending as secondary sort
          if (primarySort === 0) {
            return (a.rating || 0) - (b.rating || 0);
          }
          return primarySort;
          
        case 'highest':
          // Sort by rating descending (highest first)
          primarySort = (b.rating || 0) - (a.rating || 0);
          // If ratings are equal, sort by date descending as secondary sort
          if (primarySort === 0) {
            const dateAHigh = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateBHigh = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateBHigh - dateAHigh;
          }
          return primarySort;
          
        case 'lowest':
          // Sort by rating ascending (lowest first)
          primarySort = (a.rating || 0) - (b.rating || 0);
          // If ratings are equal, sort by date descending as secondary sort
          if (primarySort === 0) {
            const dateALow = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateBLow = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateBLow - dateALow;
          }
          return primarySort;
          
        default:
          // Default to newest first
          const dateADef = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateBDef = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateBDef - dateADef;
      }
    });

    setFilteredReviews(filtered);
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 5:
        return 'text-green-600 dark:text-green-400';
      case 4:
        return 'text-blue-600 dark:text-blue-400';
      case 3:
        return 'text-yellow-600 dark:text-yellow-400';
      case 2:
        return 'text-orange-600 dark:text-orange-400';
      case 1:
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRatingLabel = (rating) => {
    switch (rating) {
      case 5:
        return 'Excellent';
      case 4:
        return 'Very Good';
      case 3:
        return 'Good';
      case 2:
        return 'Fair';
      case 1:
        return 'Poor';
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reviews & Ratings</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage patient reviews and ratings for your services</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalReviews}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Patient feedback</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageRating > 0 ? stats.averageRating : '0.0'}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <svg
                        key={rating}
                        className={`w-5 h-5 ${
                          rating <= Math.round(stats.averageRating)
                            ? 'text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Out of 5.0 stars</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">5 Star Reviews</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.fiveStar}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stats.totalReviews > 0 ? Math.round((stats.fiveStar / stats.totalReviews) * 100) : 0}% of total
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Positive Reviews</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.fiveStar + stats.fourStar}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">4+ star ratings</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rating Distribution</h2>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats[`${rating === 5 ? 'five' : rating === 4 ? 'four' : rating === 3 ? 'three' : rating === 2 ? 'two' : 'one'}Star`];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-4">{rating}</span>
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{getRatingLabel(rating)}</span>
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rating >= 4 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                        rating === 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-24 justify-end">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-12">
                      ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by patient name, email, or comment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="flex gap-2">
              {['all', '5', '4', '3', '2', '1'].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(rating)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    ratingFilter === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {rating === 'all' ? 'All' : `${rating}★`}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing <strong>{filteredReviews.length}</strong> of <strong>{stats.totalReviews}</strong> reviews
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading reviews...</div>
        ) : filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Section - Patient Info & Rating */}
                  <div className="lg:w-1/4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(review.patient?.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                          {review.patient?.name || 'Anonymous Patient'}
                        </p>
                        {review.patient?.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {review.patient.email}
                          </p>
                        )}
                        {review.patient?.phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {review.patient.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Rating Display */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <svg
                              key={rating}
                              className={`w-5 h-5 ${
                                rating <= review.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className={`text-lg font-bold ${getRatingColor(review.rating)}`}>
                          {review.rating}.0
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {getRatingLabel(review.rating)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Right Section - Review Content */}
                  <div className="lg:w-3/4 flex-1">
                    {review.comment ? (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                        <p className="text-gray-500 dark:text-gray-400 italic">No comment provided</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 border border-gray-200 dark:border-gray-700 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              {searchQuery || ratingFilter !== 'all' 
                ? 'No reviews match your filters' 
                : 'No reviews yet'}
            </p>
            {(searchQuery || ratingFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRatingFilter('all');
                }}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorReviews;
