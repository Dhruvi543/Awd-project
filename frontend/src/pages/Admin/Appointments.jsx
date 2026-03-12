import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import ConfirmModal from '../../components/feedback/ConfirmModal';

const AdminAppointments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    consultationNotes: '',
    prescription: '',
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState(searchParams.get('dateFilter') || 'all'); // all, today, week, month
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning',
    onConfirm: null
  });

  // Update filters when URL parameters change
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const dateFilterParam = searchParams.get('dateFilter');
    const searchParam = searchParams.get('search');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (dateFilterParam) {
      setDateFilter(dateFilterParam);
    }
    if (searchParam !== null && searchParam !== searchTerm) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAppointments();
    fetchStats();
  }, [statusFilter, currentPage, searchTerm, dateFilter]);
  
  const fetchStats = async () => {
    try {
      const response = await apiService.getAdminStats();
      if (response.data.success) {
        const data = response.data.data;
        setStats({
          total: data.totalAppointments || 0,
          pending: data.pendingAppointments || 0,
          confirmed: 0, // Will be calculated
          completed: data.completedAppointments || 0,
          cancelled: 0, // Will be calculated
          today: data.todayAppointments || 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        dateFilter: dateFilter !== 'all' ? dateFilter : undefined,
      };
      const response = await apiService.getAllAppointments(params);
      if (response.data.success) {
        setAppointments(response.data.data);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      status: appointment.status || '',
      appointmentDate: appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString().split('T')[0] : '',
      startTime: appointment.startTime || '',
      endTime: appointment.endTime || '',
      consultationNotes: appointment.consultationNotes || '',
      prescription: appointment.prescription || '',
    });
    setShowModal(true);
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this appointment?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiService.deleteAppointmentAdmin(id);
          fetchAppointments();
          setConfirmModal(prev => ({
            ...prev,
            isOpen: true,
            title: 'Success',
            message: 'Appointment deleted successfully',
            confirmText: 'OK',
            cancelText: '',
            type: 'info',
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
          }));
        } catch (err) {
          setConfirmModal(prev => ({
            ...prev,
            isOpen: true,
            title: 'Error',
            message: err.response?.data?.message || 'Failed to delete appointment',
            confirmText: 'OK',
            cancelText: '',
            type: 'danger',
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
          }));
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateAppointmentAdmin(selectedAppointment._id, formData);
      alert('Appointment updated successfully');
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update appointment');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-full">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Appointment Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and oversee all appointments on the platform</p>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{appointments.filter(a => a.status === 'confirmed').length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.completed}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.today}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by patient or doctor name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setStatusFilter(newStatus);
                  setCurrentPage(1);
                  // Update URL parameter
                  const newParams = new URLSearchParams(searchParams);
                  if (newStatus === 'all') {
                    newParams.delete('status');
                  } else {
                    newParams.set('status', newStatus);
                  }
                  setSearchParams(newParams);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Appointments</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  const newDateFilter = e.target.value;
                  setDateFilter(newDateFilter);
                  setCurrentPage(1);
                  // Update URL parameter
                  const newParams = new URLSearchParams(searchParams);
                  if (newDateFilter === 'all') {
                    newParams.delete('dateFilter');
                  } else {
                    newParams.set('dateFilter', newDateFilter);
                  }
                  setSearchParams(newParams);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAppointments}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
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

        {/* Appointments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No appointments found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {appointments.map((appointment) => (
                      <tr key={appointment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{appointment.patient?.name || 'This patient is no longer available'}</div>
                          {appointment.patient?.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{appointment.patient.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{appointment.doctor?.name || 'This doctor is no longer available'}</div>
                          {appointment.doctor?.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{appointment.doctor.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Not specified'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {appointment.createdAt ? `Created: ${new Date(appointment.createdAt).toLocaleDateString()}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {appointment.startTime || 'Not specified'} - {appointment.endTime || 'Not specified'}
                          </div>
                          {appointment.startTime && appointment.endTime && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Duration: {Math.round((new Date(`2000-01-01 ${appointment.endTime}`) - new Date(`2000-01-01 ${appointment.startTime}`)) / (1000 * 60))} min
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(appointment)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(appointment._id)}
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
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} appointments
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <span aria-hidden="true">←</span>
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                      disabled={currentPage === pagination.pages}
                      className="px-4 py-2 inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <span>Next</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Modal */}
        {showViewModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Patient:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">
                    {selectedAppointment.patient?.name || 'This patient is no longer available'} 
                    {selectedAppointment.patient?.email && ` (${selectedAppointment.patient.email})`}
                  </div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Doctor:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">
                    {selectedAppointment.doctor?.name || 'This doctor is no longer available'} 
                    {selectedAppointment.doctor?.email && ` (${selectedAppointment.doctor.email})`}
                  </div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Date:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">
                    {selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : 'Not specified'}
                  </div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Time:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">
                    {selectedAppointment.startTime || 'Not specified'} - {selectedAppointment.endTime || 'Not specified'}
                  </div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Status:</div>
                  <div className="w-2/3">
                    {selectedAppointment.status ? (
                      <span className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${
                        selectedAppointment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        selectedAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not specified</span>
                    )}
                  </div>
                </div>
                {selectedAppointment.consultationNotes && (
                  <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Consultation Notes:</div>
                    <div className="w-2/3 text-gray-900 dark:text-white">{selectedAppointment.consultationNotes}</div>
                  </div>
                )}
                {selectedAppointment.prescription && (
                  <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Prescription:</div>
                    <div className="w-2/3 text-gray-900 dark:text-white">{selectedAppointment.prescription}</div>
                  </div>
                )}
                <div className="flex items-center">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Created At:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">
                    {new Date(selectedAppointment.createdAt).toLocaleString()}
                  </div>
                </div>
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
      />
    </div>
  );
};

export default AdminAppointments;
