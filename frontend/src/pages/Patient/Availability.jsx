import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import DoctorAvailabilityCalendar from '../../components/DoctorAvailabilityCalendar';

const PatientAvailability = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const [availability, setAvailability] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
    if (doctorId) {
      fetchAvailability(doctorId);
    }
  }, [doctorId]);

  const fetchDoctors = async () => {
    try {
      const response = await apiService.getDoctors();
      if (response.data.success) {
        setDoctors(response.data.data || []);
        if (doctorId) {
          const doctor = response.data.data.find(d => d._id === doctorId);
          setSelectedDoctor(doctor);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailability = async (id) => {
    try {
      setIsLoading(true);
      const response = await apiService.getDoctorAvailability(id);
      if (response.data.success) {
        setAvailability(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    fetchAvailability(doctor._id);
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Doctor Availability</h1>
          <p className="text-gray-600 dark:text-gray-400">Check when doctors are available for appointments</p>
        </div>

        {/* Doctor Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select a Doctor
          </label>
          <select
            value={selectedDoctor?._id || ''}
            onChange={(e) => {
              const doctor = doctors.find(d => d._id === e.target.value);
              if (doctor) handleDoctorSelect(doctor);
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                Dr. {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Display */}
        {selectedDoctor ? (
          isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading availability...</div>
          ) : (
            <>
              {/* Doctor Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Dr. {selectedDoctor.name} - {selectedDoctor.specialization}
                </h2>
              </div>

              {/* Calendar View */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <DoctorAvailabilityCalendar 
                  availability={availability}
                  doctorId={selectedDoctor._id}
                  readOnly={true}
                />
              </div>

              {/* Quick Book Button */}
              <div className="mt-6 text-center">
                <Link
                  to={`/patient/book-appointment?doctorId=${selectedDoctor._id}`}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
                >
                  Book Appointment with Dr. {selectedDoctor.name}
                </Link>
              </div>
            </>
          )
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 border border-gray-200 dark:border-gray-700 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please select a doctor to view their availability</p>
            <Link
              to="/patient/find-doctor"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Doctors
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAvailability;
