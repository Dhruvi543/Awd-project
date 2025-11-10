import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import { useAuth } from '../../contexts/AuthContext';

const DoctorDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctorDetails();
  }, [id]);

  const fetchDoctorDetails = async () => {
    try {
      const response = await apiService.getDoctor(id);
      setDoctor(response.data.doctor);
    } catch (err) {
      setError('Failed to fetch doctor details');
      console.error('Error fetching doctor details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Doctor not found'}</p>
          <Link
            to="/doctors"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          to="/doctors"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Doctors
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Doctor Image and Basic Info */}
          <div className="md:w-1/3 bg-gray-50 p-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-bold text-blue-600">
                  {doctor.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{doctor.name}</h1>
              <p className="text-blue-600 font-medium mb-4">{doctor.specialization}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Experience:</span> {doctor.experience} years</p>
                <p><span className="font-medium">Education:</span> {doctor.education}</p>
                <p><span className="font-medium">Location:</span> {doctor.location}</p>
              </div>
            </div>
          </div>

          {/* Doctor Details */}
          <div className="md:w-2/3 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">
                {doctor.bio || 'Dr. ' + doctor.name + ' is a highly experienced ' + doctor.specialization + 
                  ' with ' + doctor.experience + ' years of practice. They are committed to providing quality healthcare services to patients.'}
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {doctor.specialization.split(',').map((spec, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {spec.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Consultation Fee</h2>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-green-600">${doctor.consultationFee}</span>
                <span className="text-gray-500 ml-2">per consultation</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Availability</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Working Days:</span> {doctor.workingDays || 'Monday - Saturday'}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Working Hours:</span> {doctor.workingHours || '9:00 AM - 5:00 PM'}
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              {isAuthenticated ? (
                <Link
                  to={`/book-appointment?doctor=${doctor._id}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Book Appointment
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: `/doctors/${doctor._id}` }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Login to Book Appointment
                </Link>
              )}
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Contact Clinic
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetails;