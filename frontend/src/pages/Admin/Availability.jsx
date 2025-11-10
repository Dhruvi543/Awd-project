import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';

const AdminAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchAvailability();
    fetchDoctors();
  }, [doctorFilter, typeFilter, currentPage]);

  const fetchDoctors = async () => {
    try {
      const response = await apiService.getAllDoctors({ status: 'approved' });
      if (response.data.success) {
        setDoctors(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 10,
        doctorId: doctorFilter || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      };
      const response = await apiService.getAllAvailability(params);
      if (response.data.success) {
        setAvailability(response.data.data);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch availability');
      console.error('Error fetching availability:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (item) => {
    setSelectedAvailability(item);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this availability? This action cannot be undone.')) {
      return;
    }
    try {
      await apiService.deleteAvailability(id);
      fetchAvailability();
      alert('Availability deleted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete availability');
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Availability Overview</h1>
            <p className="text-gray-600 dark:text-gray-400">View doctor availability and leaves. Only doctors can set their availability.</p>
          </div>
          
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Admin View Only</h3>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  As an admin, you can only view and delete availability records. Doctors manage their own availability schedules and leaves through their dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Doctor</label>
              <select
                value={doctorFilter}
                onChange={(e) => {
                  setDoctorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="schedule">Schedule</option>
                <option value="leave">Leave</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAvailability}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Availability Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : availability.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No availability found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day/Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {availability.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.doctor?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.doctor?.specialization || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.type === 'schedule' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.type === 'schedule' && item.dayOfWeek !== undefined
                              ? daysOfWeek[item.dayOfWeek]
                              : item.startDate
                              ? `${new Date(item.startDate).toLocaleDateString()}${item.endDate ? ` - ${new Date(item.endDate).toLocaleDateString()}` : ''}`
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(item)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} availability
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                      disabled={currentPage === pagination.pages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>


        {/* View Modal */}
        {showViewModal && selectedAvailability && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Availability Details</h2>
              <div className="space-y-3">
                <div><strong>Doctor:</strong> {selectedAvailability.doctor?.name} ({selectedAvailability.doctor?.specialization})</div>
                <div><strong>Type:</strong> {selectedAvailability.type}</div>
                {selectedAvailability.type === 'schedule' ? (
                  <>
                    <div><strong>Day:</strong> {selectedAvailability.dayOfWeek !== undefined ? daysOfWeek[selectedAvailability.dayOfWeek] : 'N/A'}</div>
                    <div><strong>Time:</strong> {selectedAvailability.startTime && selectedAvailability.endTime ? `${selectedAvailability.startTime} - ${selectedAvailability.endTime}` : 'N/A'}</div>
                  </>
                ) : (
                  <>
                    <div><strong>Start Date:</strong> {selectedAvailability.startDate ? new Date(selectedAvailability.startDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>End Date:</strong> {selectedAvailability.endDate ? new Date(selectedAvailability.endDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Reason:</strong> {selectedAvailability.reason || 'N/A'}</div>
                  </>
                )}
                <div><strong>Status:</strong> <span className={selectedAvailability.isActive ? 'text-green-600' : 'text-red-600'}>{selectedAvailability.isActive ? 'Active' : 'Inactive'}</span></div>
                <div><strong>Created At:</strong> {new Date(selectedAvailability.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAvailability;
