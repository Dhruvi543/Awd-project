import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';
import DoctorAvailabilityCalendar from '../../components/DoctorAvailabilityCalendar';

const AdminAvailability = () => {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDoctorForCalendar, setSelectedDoctorForCalendar] = useState(null);
  const [doctorAvailability, setDoctorAvailability] = useState([]);


  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorForCalendar) {
      fetchDoctorAvailabilityForCalendar(selectedDoctorForCalendar);
    }
  }, [selectedDoctorForCalendar]);

  const fetchDoctorAvailabilityForCalendar = async (doctorId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getDoctorAvailability(doctorId);
      if (response.data.success) {
        setDoctorAvailability(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching doctor availability:', err);
      setError(err.response?.data?.message || 'Failed to fetch availability');
      setDoctorAvailability([]);
    } finally {
      setIsLoading(false);
    }
  };

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


  return (
    <div className="w-full max-w-full">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Availability Overview</h1>
            <p className="text-gray-600 dark:text-gray-400">View doctor availability and leaves. Only doctors can set their availability.</p>
          </div>
        </div>

        {/* Doctor Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Doctor to View Calendar
          </label>
          <select
            value={selectedDoctorForCalendar || ''}
            onChange={(e) => setSelectedDoctorForCalendar(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a doctor --</option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Calendar View */}
        {selectedDoctorForCalendar ? (
          isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading calendar...</div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {doctors.find(d => d._id === selectedDoctorForCalendar)?.name || 'Doctor'} - Availability Calendar
                </h3>
              </div>
              <DoctorAvailabilityCalendar 
                availability={doctorAvailability}
                doctorId={selectedDoctorForCalendar}
                readOnly={true}
              />
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 border border-gray-200 dark:border-gray-700 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">Please select a doctor to view their availability calendar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAvailability;
