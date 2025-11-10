import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getAnalytics({ period });
      if (response.data.success) {
        const data = response.data.data;
        console.log('Analytics data received:', data);
        
        // Ensure arrays exist and are properly formatted
        if (data.userGrowth && !Array.isArray(data.userGrowth)) {
          data.userGrowth = [];
        }
        if (data.appointmentsOverTime && !Array.isArray(data.appointmentsOverTime)) {
          data.appointmentsOverTime = [];
        }
        
        // Validate and normalize data structure
        if (data.userGrowth) {
          data.userGrowth = data.userGrowth.map(item => ({
            _id: item._id || '',
            count: Number(item.count) || 0
          }));
        }
        
        if (data.appointmentsOverTime) {
          data.appointmentsOverTime = data.appointmentsOverTime.map(item => ({
            _id: item._id || '',
            count: Number(item.count) || 0
          }));
        }
        
        console.log('Normalized analytics data:', {
          userGrowth: data.userGrowth?.length || 0,
          appointmentsOverTime: data.appointmentsOverTime?.length || 0
        });
        
        setAnalytics(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const SimpleBarChart = ({ data, title, color = 'blue' }) => {
    if (!data || data.length === 0) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No data available</div>;
    
    const maxValue = Math.max(...data.map(d => d.count || 0));
    const total = data.reduce((sum, d) => sum + (d.count || 0), 0);
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
    };

    return (
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.count || 0) / total * 100).toFixed(1) : 0;
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{item._id || 'N/A'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">{item.count || 0}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">({percentage}%)</span>
                </div>
              </div>
              <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorClasses[color]} transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${((item.count || 0) / maxValue) * 100}%` }}
                >
                  {((item.count || 0) / maxValue) * 100 > 15 && (
                    <span className="text-xs font-medium text-white">{item.count || 0}</span>
                  )}
                </div>
                {((item.count || 0) / maxValue) * 100 <= 15 && (
                  <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {item.count || 0}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const SimpleLineChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No data available</p>
          <p className="text-xs mt-2">Try selecting a different time period</p>
        </div>
      );
    }
    
    // Filter out invalid data and ensure we have valid counts
    const validData = data.filter(d => d && d._id && (d.count !== undefined && d.count !== null));
    if (validData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No valid data points</p>
        </div>
      );
    }
    
    const counts = validData.map(d => Number(d.count) || 0);
    const maxValue = Math.max(...counts, 1); // Ensure at least 1 to avoid issues
    const minValue = Math.min(...counts, 0);
    const range = maxValue - minValue || 1; // Prevent division by zero
    const total = counts.reduce((sum, count) => sum + count, 0);
    const average = validData.length > 0 ? total / validData.length : 0;

    // Format date for display - handle YYYY-MM-DD format from MongoDB
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      try {
        // Handle YYYY-MM-DD format
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
          const [year, month, day] = dateStr.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (isNaN(date.getTime())) return dateStr;
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

    // Chart dimensions (in viewBox coordinates)
    const chartWidth = 90; // 90% of viewBox width (5% padding on each side)
    const chartHeight = 80; // 80% of viewBox height (10% padding top, 10% bottom)
    const paddingLeft = 5;
    const paddingTop = 10;
    const paddingBottom = 10;

    // Calculate points for the line chart using absolute numeric coordinates
    const getPoint = (index, count) => {
      const dataLength = validData.length;
      // Calculate X position (horizontal spacing)
      let x;
      if (dataLength === 1) {
        x = paddingLeft + chartWidth / 2; // Center single point
      } else {
        x = paddingLeft + (index / (dataLength - 1)) * chartWidth;
      }
      
      // Calculate Y position (vertical position based on value)
      const numCount = Number(count) || 0;
      let normalizedValue;
      if (range > 0) {
        normalizedValue = (numCount - minValue) / range;
      } else {
        normalizedValue = 0.5; // Center if all values are the same
      }
      
      // Invert Y axis (SVG Y increases downward, but we want higher values at top)
      const y = paddingTop + chartHeight - (normalizedValue * chartHeight);
      
      // Ensure coordinates are within bounds
      return { 
        x: Math.max(paddingLeft, Math.min(paddingLeft + chartWidth, x)), 
        y: Math.max(paddingTop, Math.min(paddingTop + chartHeight, y))
      };
    };

    // Generate points string for polyline (must be space-separated "x,y" pairs)
    const pointsString = validData.map((item, index) => {
      const point = getPoint(index, item.count || 0);
      // Ensure we return numbers, not strings with % or other characters
      return `${point.x},${point.y}`;
    }).join(' ');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total: </span>
            <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Avg: </span>
            <span className="font-semibold text-gray-900 dark:text-white">{average.toFixed(1)}</span>
          </div>
        </div>
        <div className="relative h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: 'visible' }}
          >
            {/* Grid lines */}
            {[10, 30, 50, 70, 90].map((y) => (
              <line
                key={y}
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + chartWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.3"
                strokeDasharray="1,1"
                className="dark:stroke-gray-700"
              />
            ))}
            
            {/* Y-axis line */}
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={paddingTop + chartHeight}
              stroke="#d1d5db"
              strokeWidth="0.5"
              className="dark:stroke-gray-600"
            />
            
            {/* X-axis line */}
            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={paddingLeft + chartWidth}
              y2={paddingTop + chartHeight}
              stroke="#d1d5db"
              strokeWidth="0.5"
              className="dark:stroke-gray-600"
            />
            
            {/* Line chart - render polyline with numeric coordinates */}
            {validData.length > 0 && pointsString && (
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            )}
            
            {/* Data points */}
            {validData.map((item, index) => {
              const point = getPoint(index, item.count || 0);
              return (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth="1.5"
                    className="hover:r-4 transition-all cursor-pointer"
                  />
                  <title>{formatDate(item._id)}: {item.count || 0}</title>
                </g>
              );
            })}
          </svg>
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-2 pb-1">
            {validData.length > 0 && validData.length <= 10 ? (
              validData.map((item, index) => (
                <span key={index} className="transform -rotate-45 origin-left whitespace-nowrap" style={{ fontSize: '10px' }}>
                  {formatDate(item._id)}
                </span>
              ))
            ) : validData.length > 0 ? (
              <>
                <span style={{ fontSize: '10px' }}>{formatDate(validData[0]?._id)}</span>
                {validData.length > 1 && <span style={{ fontSize: '10px' }}>{formatDate(validData[Math.floor(validData.length / 2)]?._id)}</span>}
                <span style={{ fontSize: '10px' }}>{formatDate(validData[validData.length - 1]?._id)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">View detailed analytics and insights for your platform</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          {/* Summary Statistics */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {analytics.usersByRole?.reduce((sum, r) => sum + (r.count || 0), 0) || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Appointments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {analytics.appointmentsOverTime?.reduce((sum, a) => sum + (a.count || 0), 0) || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {analytics.reviewsByRating?.reduce((sum, r) => sum + (r.count || 0), 0) || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {analytics.reviewsByRating && analytics.reviewsByRating.length > 0
                        ? (
                            analytics.reviewsByRating.reduce((sum, r) => sum + ((r._id || 0) * (r.count || 0)), 0) /
                            analytics.reviewsByRating.reduce((sum, r) => sum + (r.count || 0), 0)
                          ).toFixed(1)
                        : '0.0'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Growth</h2>
              <SimpleLineChart data={analytics.userGrowth || []} />
            </div>

            {/* Appointments Over Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Appointments Over Time</h2>
              <SimpleLineChart data={analytics.appointmentsOverTime || []} />
            </div>

            {/* Appointments by Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Appointments by Status</h2>
              <SimpleBarChart data={analytics.appointmentsByStatus || []} color="green" />
            </div>

            {/* Reviews by Rating */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reviews by Rating</h2>
              <SimpleBarChart data={analytics.reviewsByRating || []} color="orange" />
            </div>

            {/* Users by Role */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Users by Role</h2>
              <SimpleBarChart data={analytics.usersByRole || []} color="purple" />
            </div>

            {/* Top Doctors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Doctors by Appointments</h2>
              {analytics.topDoctors && analytics.topDoctors.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topDoctors.map((doctor, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{doctor.doctorName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{doctor.specialization || 'N/A'}</div>
                          {doctor.doctorEmail && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">{doctor.doctorEmail}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{doctor.appointmentCount}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">appointments</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No data available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
