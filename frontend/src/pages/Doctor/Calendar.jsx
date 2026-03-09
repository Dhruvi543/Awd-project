import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/apiService';
import DoctorAvailabilityCalendar from '../../components/DoctorAvailabilityCalendar';

const DoctorCalendar = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMyAvailability();
      if (response.data.success) {
        setAvailability(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            View your availability and leave schedule in calendar format
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Loading calendar...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <DoctorAvailabilityCalendar 
              availability={availability}
              readOnly={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorCalendar;
