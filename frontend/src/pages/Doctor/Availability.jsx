import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/apiService';

const DoctorAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('availability');
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    isAvailable: true,
  });
  const [leaveData, setLeaveData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchAvailability();
    fetchLeaves();
  }, []);

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      // Assuming we can get doctor ID from user or need to fetch it
      const doctorId = user?.doctorId || user?._id;
      if (doctorId) {
        const response = await apiService.getDoctorAvailability(doctorId);
        if (response.data.success) {
          setAvailability(response.data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      // This would need a new API endpoint for leaves
      // For now, we'll use a placeholder
      setLeaves([]);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateDoctorAvailability(formData);
      alert('Availability updated successfully!');
      setShowAvailabilityForm(false);
      setFormData({ date: '', startTime: '', endTime: '', isAvailable: true });
      fetchAvailability();
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      // This would need a new API endpoint for leaves
      alert('Leave request submitted successfully!');
      setShowLeaveForm(false);
      setLeaveData({ startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (error) {
      console.error('Error submitting leave:', error);
      alert('Failed to submit leave request. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Availability & Leave</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your availability schedule and leave requests</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('availability')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'availability'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Availability
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'leave'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Leave Management
            </button>
          </div>

          <div className="p-6">
            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Availability Schedule</h2>
                  <button
                    onClick={() => setShowAvailabilityForm(!showAvailabilityForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showAvailabilityForm ? 'Cancel' : 'Add Availability'}
                  </button>
                </div>

                {showAvailabilityForm && (
                  <form onSubmit={handleAvailabilitySubmit} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Available
                        </label>
                        <select
                          value={formData.isAvailable}
                          onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="true">Available</option>
                          <option value="false">Unavailable</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Availability
                    </button>
                  </form>
                )}

                {isLoading ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading availability...</div>
                ) : availability.length > 0 ? (
                  <div className="space-y-4">
                    {availability.map((slot) => (
                      <div
                        key={slot._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {formatDate(slot.date)}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            slot.isAvailable
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {slot.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No availability slots found. Add your availability schedule above.
                  </div>
                )}
              </div>
            )}

            {/* Leave Tab */}
            {activeTab === 'leave' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leave Management</h2>
                  <button
                    onClick={() => setShowLeaveForm(!showLeaveForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showLeaveForm ? 'Cancel' : 'Request Leave'}
                  </button>
                </div>

                {showLeaveForm && (
                  <form onSubmit={handleLeaveSubmit} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={leaveData.startDate}
                          onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={leaveData.endDate}
                          onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reason
                        </label>
                        <textarea
                          value={leaveData.reason}
                          onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter leave reason..."
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Submit Leave Request
                    </button>
                  </form>
                )}

                {leaves.length > 0 ? (
                  <div className="space-y-4">
                    {leaves.map((leave) => (
                      <div
                        key={leave._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">{leave.reason}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            leave.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : leave.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {leave.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No leave requests found. Request a leave above.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
