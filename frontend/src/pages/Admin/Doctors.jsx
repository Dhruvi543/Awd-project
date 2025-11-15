import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';

const AdminDoctors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    specialization: '',
    experience: '',
    qualification: '',
    location: '',
    licenseNo: '',
    clinicHospitalType: '',
    clinicHospitalName: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalAppointments: 0
  });

  // Sync search term from URL
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDoctors();
    fetchStats();
  }, [statusFilter, currentPage, searchTerm, specializationFilter]);

  // Check for action=add query parameter to auto-open add modal
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      // Reset form and open modal
      setSelectedDoctor(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        specialization: '',
        experience: '',
        qualification: '',
        location: '',
        licenseNo: '',
        clinicHospitalType: '',
        clinicHospitalName: '',
        password: '',
      });
      setErrors({});
      setShowModal(true);
      // Remove the query parameter from URL after opening modal
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);
  
  const fetchStats = async () => {
    try {
      const response = await apiService.getAdminStats();
      if (response.data.success) {
        const data = response.data.data;
        setStats({
          total: data.totalDoctors || 0,
          approved: (data.totalDoctors || 0) - (data.pendingDoctors || 0),
          pending: data.pendingDoctors || 0,
          totalAppointments: data.totalAppointments || 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        specialization: specializationFilter !== 'all' ? specializationFilter : undefined,
      };
      const response = await apiService.getAllDoctors(params);
      if (response.data.success) {
        setDoctors(response.data.data);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctors');
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name);
  };

  const validateTextOnly = (text) => {
    // Only letters, spaces, hyphens, and apostrophes allowed
    const textRegex = /^[a-zA-Z\s\-']{2,}$/;
    return textRegex.test(text);
  };

  const validateEmail = (email) => {
    // Email validation - only allows .com extension
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validateLicenseNo = (licenseNo) => {
    // Pattern: 2 uppercase letters / 4-digit year (1900-2099) / 5 or 6 digit serial number
    const licenseRegex = /^[A-Z]{2}\/(19|20)\d{2}\/\d{5,6}$/;
    return licenseRegex.test(licenseNo.trim());
  };

  const validateExperience = (experience) => {
    const exp = parseInt(experience);
    return !isNaN(exp) && exp >= 0 && exp <= 50;
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleCreate = () => {
    setSelectedDoctor(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: '',
      specialization: '',
      experience: '',
      qualification: '',
      location: '',
      licenseNo: '',
      clinicHospitalType: '',
      clinicHospitalName: '',
      password: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      firstName: doctor.firstName || '',
      lastName: doctor.lastName || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      gender: doctor.gender || '',
      specialization: doctor.specialization || '',
      experience: doctor.experience || '',
      qualification: doctor.qualification || '',
      location: doctor.location || '',
      licenseNo: doctor.licenseNo || '',
      clinicHospitalType: doctor.clinicHospitalType || '',
      clinicHospitalName: doctor.clinicHospitalName || '',
      password: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleView = (doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) {
      return;
    }
    try {
      await apiService.deleteDoctor(id);
      fetchDoctors();
      alert('Doctor deleted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete doctor');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this doctor?')) {
      return;
    }
    try {
      await apiService.approveDoctor(id);
      fetchDoctors();
      alert('Doctor approved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve doctor');
    }
  };

  const handleReject = (doctor) => {
    setSelectedDoctor(doctor);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    const rejectionReason = document.getElementById('rejectionReason').value;
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await apiService.rejectDoctor(selectedDoctor._id, rejectionReason);
      setShowRejectModal(false);
      fetchDoctors();
      alert('Doctor rejected successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject doctor');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(formData.firstName)) {
      if (/\d/.test(formData.firstName)) {
        newErrors.firstName = 'First name cannot contain numbers';
      } else {
        newErrors.firstName = 'Name must contain only letters and be at least 2 characters';
      }
    }

    // Last Name validation
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(formData.lastName)) {
      if (/\d/.test(formData.lastName)) {
        newErrors.lastName = 'Last name cannot contain numbers';
      } else {
        newErrors.lastName = 'Name must contain only letters and be at least 2 characters';
      }
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }

    // Specialization validation
    if (!formData.specialization) {
      newErrors.specialization = 'Specialization is required';
    } else if (!validateTextOnly(formData.specialization)) {
      if (/\d/.test(formData.specialization)) {
        newErrors.specialization = 'Specialization cannot contain numbers';
      } else {
        newErrors.specialization = 'Specialization must contain only letters and be at least 2 characters';
      }
    }

    // Experience validation
    if (!formData.experience) {
      newErrors.experience = 'Years of experience is required';
    } else if (!validateExperience(formData.experience)) {
      newErrors.experience = 'Experience must be between 0 and 50 years';
    }

    // Qualification validation
    if (!formData.qualification) {
      newErrors.qualification = 'Qualification is required';
    } else if (!validateTextOnly(formData.qualification)) {
      if (/\d/.test(formData.qualification)) {
        newErrors.qualification = 'Qualification cannot contain numbers';
      } else {
        newErrors.qualification = 'Qualification must contain only letters and be at least 2 characters';
      }
    }

    // Location validation
    if (!formData.location) {
      newErrors.location = 'Location is required';
    } else if (!validateTextOnly(formData.location)) {
      if (/\d/.test(formData.location)) {
        newErrors.location = 'Location cannot contain numbers';
      } else {
        newErrors.location = 'Location must contain only letters and be at least 2 characters';
      }
    }

    // Clinic/Hospital Type validation
    if (!formData.clinicHospitalType) {
      newErrors.clinicHospitalType = 'Please select clinic or hospital';
    }

    // Clinic/Hospital Name validation
    if (!formData.clinicHospitalName) {
      newErrors.clinicHospitalName = `${formData.clinicHospitalType === 'clinic' ? 'Clinic' : 'Hospital'} name is required`;
    } else if (!validateTextOnly(formData.clinicHospitalName)) {
      if (/\d/.test(formData.clinicHospitalName)) {
        newErrors.clinicHospitalName = 'Clinic/Hospital name cannot contain numbers';
      } else {
        newErrors.clinicHospitalName = 'Name must contain only letters and be at least 2 characters';
      }
    }

    // Password validation (only for new doctors)
    if (!selectedDoctor) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (!validatePassword(formData.password)) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (selectedDoctor) {
        // Update
        await apiService.updateDoctor(selectedDoctor._id, formData);
        alert('Doctor updated successfully');
      } else {
        // Create
        await apiService.createDoctor(formData);
        alert('Doctor created successfully');
      }
      setShowModal(false);
      setErrors({});
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save doctor');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Only block numbers for phone and experience
    if (name === 'phone') {
      // Only allow numbers, max 10 digits
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'experience') {
      // Only allow numbers
      processedValue = value.replace(/\D/g, '');
    } else if (name === 'licenseNo') {
      // Allow uppercase letters, numbers, and slashes only
      // Auto-format: convert to uppercase, allow only valid characters
      processedValue = value.toUpperCase().replace(/[^A-Z0-9\/]/g, '');
    }
    // For text fields (firstName, lastName, qualification, specialization, location, clinicHospitalName)
    // Don't block, but validate and show errors

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Clear error when user starts typing (only if field becomes valid)
    if (errors[name]) {
      // Check if the field is now valid
      let isValid = true;
      if ((name === 'firstName' || name === 'lastName') && processedValue && !validateName(processedValue)) {
        isValid = false;
      } else if (name === 'qualification' && processedValue && !validateTextOnly(processedValue)) {
        isValid = false;
      } else if (name === 'specialization' && processedValue && !validateTextOnly(processedValue)) {
        isValid = false;
      } else if (name === 'location' && processedValue && !validateTextOnly(processedValue)) {
        isValid = false;
      } else if (name === 'clinicHospitalName' && processedValue && !validateTextOnly(processedValue)) {
        isValid = false;
      }
      
      if (isValid) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }

    // Real-time validation
    let error = '';
    if ((name === 'firstName' || name === 'lastName') && processedValue) {
      if (!validateName(processedValue)) {
        // Check if it contains numbers
        if (/\d/.test(processedValue)) {
          error = 'Name cannot contain numbers';
        } else {
          error = 'Name must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'email' && processedValue && !validateEmail(processedValue)) {
      error = 'Please enter a valid email address';
    } else if (name === 'phone' && processedValue && !validatePhone(processedValue)) {
      error = 'Phone number must be exactly 10 digits';
    } else if (name === 'password' && processedValue && !validatePassword(processedValue)) {
      error = 'Password must be at least 6 characters';
    } else if (name === 'experience' && processedValue && !validateExperience(processedValue)) {
      error = 'Experience must be between 0 and 50 years';
    } else if (name === 'qualification' && processedValue) {
      if (!validateTextOnly(processedValue)) {
        if (/\d/.test(processedValue)) {
          error = 'Qualification cannot contain numbers';
        } else {
          error = 'Qualification must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'specialization' && processedValue) {
      if (!validateTextOnly(processedValue)) {
        if (/\d/.test(processedValue)) {
          error = 'Specialization cannot contain numbers';
        } else {
          error = 'Specialization must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'location' && processedValue) {
      if (!validateTextOnly(processedValue)) {
        if (/\d/.test(processedValue)) {
          error = 'Location cannot contain numbers';
        } else {
          error = 'Location must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'clinicHospitalName' && processedValue) {
      if (!validateTextOnly(processedValue)) {
        if (/\d/.test(processedValue)) {
          error = 'Clinic/Hospital name cannot contain numbers';
        } else {
          error = 'Name must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'licenseNo' && processedValue) {
      if (!validateLicenseNo(processedValue)) {
        error = 'License number must be in format: XX/YYYY/XXXXX (e.g., TN/2020/123456)';
      }
    }

    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';

    if (name === 'firstName' || name === 'lastName') {
      if (!value) {
        error = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
      } else if (!validateName(value)) {
        if (/\d/.test(value)) {
          error = `${name === 'firstName' ? 'First' : 'Last'} name cannot contain numbers`;
        } else {
          error = 'Name must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'email') {
      if (!value) {
        error = 'Email is required';
      } else if (!validateEmail(value)) {
        error = 'Please enter a valid email address';
      }
    } else if (name === 'phone') {
      if (!value) {
        error = 'Phone number is required';
      } else if (!validatePhone(value)) {
        error = 'Phone number must be exactly 10 digits';
      }
    } else if (name === 'gender') {
      if (!value) {
        error = 'Please select a gender';
      }
    } else if (name === 'specialization') {
      if (!value) {
        error = 'Specialization is required';
      } else if (!validateTextOnly(value)) {
        if (/\d/.test(value)) {
          error = 'Specialization cannot contain numbers';
        } else {
          error = 'Specialization must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'experience') {
      if (!value) {
        error = 'Years of experience is required';
      } else if (!validateExperience(value)) {
        error = 'Experience must be between 0 and 50 years';
      }
    } else if (name === 'qualification') {
      if (!value) {
        error = 'Qualification is required';
      } else if (!validateTextOnly(value)) {
        if (/\d/.test(value)) {
          error = 'Qualification cannot contain numbers';
        } else {
          error = 'Qualification must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'location') {
      if (!value) {
        error = 'Location is required';
      } else if (!validateTextOnly(value)) {
        if (/\d/.test(value)) {
          error = 'Location cannot contain numbers';
        } else {
          error = 'Location must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'clinicHospitalType') {
      if (!value) {
        error = 'Please select clinic or hospital';
      }
    } else if (name === 'clinicHospitalName') {
      if (!value) {
        error = `${formData.clinicHospitalType === 'clinic' ? 'Clinic' : 'Hospital'} name is required`;
      } else if (!validateTextOnly(value)) {
        if (/\d/.test(value)) {
          error = 'Clinic/Hospital name cannot contain numbers';
        } else {
          error = 'Name must contain only letters and be at least 2 characters';
        }
      }
    } else if (name === 'licenseNo' && value) {
      if (!validateLicenseNo(value)) {
        error = 'License number must be in format: XX/YYYY/XXXXX (e.g., TN/2020/123456)';
      }
    } else if (name === 'password' && !selectedDoctor) {
      if (!value) {
        error = 'Password is required';
      } else if (!validatePassword(value)) {
        error = 'Password must be at least 6 characters';
      }
    }

    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Doctor Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and oversee all doctors on the platform</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Doctor
            </button>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Doctors</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.approved}</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Appointments</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalAppointments}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, or specialization..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Doctors</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialization</label>
              <select
                value={specializationFilter}
                onChange={(e) => {
                  setSpecializationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Specializations</option>
                {[...new Set(doctors.map(d => d.specialization).filter(Boolean))].sort().map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchDoctors}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
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

        {/* Doctors Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No doctors found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Specialization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {doctors.map((doctor) => (
                      <tr key={doctor._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{doctor.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {doctor.phone || 'No phone'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{doctor.email}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Joined: {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'Not available'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{doctor.specialization || 'Not specified'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {doctor.location || 'No location'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{doctor.experience ? `${doctor.experience} years` : 'Not specified'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {doctor.qualification || 'No qualification'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            doctor.isApproved
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {doctor.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(doctor)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {!doctor.isApproved ? (
                              // For pending doctors: show Approve and Reject buttons
                              <>
                                <button
                                  onClick={() => handleApprove(doctor._id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Approve"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReject(doctor)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Reject"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              // For approved doctors: only show Delete button
                              <button
                                onClick={() => handleDelete(doctor._id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
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
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} doctors
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

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="First name"
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Last name"
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Email address"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      maxLength={10}
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="10 digit number"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.gender ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Specialization <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.specialization ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., Cardiology"
                    />
                    {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Experience (years) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      min="0"
                      max="50"
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.experience ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Years (0-50)"
                    />
                    {errors.experience && <p className="mt-1 text-xs text-red-500">{errors.experience}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.qualification ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., MBBS, MD"
                    />
                    {errors.qualification && <p className="mt-1 text-xs text-red-500">{errors.qualification}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.location ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Location/city"
                    />
                    {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      License No <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNo"
                      value={formData.licenseNo}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      maxLength={15}
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.licenseNo ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., TN/2020/123456"
                    />
                    {errors.licenseNo && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.licenseNo}</p>
                    )}
                    {!errors.licenseNo && formData.licenseNo && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Format: 2 uppercase letters / 4-digit year / 5-6 digit number
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Clinic/Hospital Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="clinicHospitalType"
                      value={formData.clinicHospitalType}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.clinicHospitalType ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Select Type</option>
                      <option value="clinic">Clinic</option>
                      <option value="hospital">Hospital</option>
                    </select>
                    {errors.clinicHospitalType && <p className="mt-1 text-xs text-red-500">{errors.clinicHospitalType}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {formData.clinicHospitalType === 'clinic' ? 'Clinic' : formData.clinicHospitalType === 'hospital' ? 'Hospital' : 'Clinic/Hospital'} Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clinicHospitalName"
                      value={formData.clinicHospitalName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      disabled={!formData.clinicHospitalType}
                      className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.clinicHospitalName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={formData.clinicHospitalType === 'clinic' ? 'Enter clinic name' : formData.clinicHospitalType === 'hospital' ? 'Enter hospital name' : 'Select type first'}
                    />
                    {errors.clinicHospitalName && <p className="mt-1 text-xs text-red-500">{errors.clinicHospitalName}</p>}
                  </div>
                  {!selectedDoctor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                        className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Password (min 6 characters)"
                      />
                      {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {selectedDoctor ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowViewModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Details</h2>
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
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Full Name:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white font-semibold">
                    {selectedDoctor.name || `${selectedDoctor.firstName || ''} ${selectedDoctor.lastName || ''}`.trim() || 'This doctor is no longer available'}
                  </div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Email:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">{selectedDoctor.email || 'Not provided'}</div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Phone:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">{selectedDoctor.phone || 'Not provided'}</div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Gender:</div>
                  <div className="w-2/3">
                    {selectedDoctor.gender ? (
                      <span className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${
                        selectedDoctor.gender === 'male' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        selectedDoctor.gender === 'female' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {selectedDoctor.gender.charAt(0).toUpperCase() + selectedDoctor.gender.slice(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not specified</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Specialization:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">{selectedDoctor.specialization || 'Not specified'}</div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Experience:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">
                    {selectedDoctor.experience ? `${selectedDoctor.experience} years` : 'Not specified'}
                  </div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Qualification:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">{selectedDoctor.qualification || 'Not specified'}</div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Location:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">{selectedDoctor.location || 'Not specified'}</div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">License Number:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">{selectedDoctor.licenseNo || 'Not specified'}</div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Clinic/Hospital Type:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white capitalize">{selectedDoctor.clinicHospitalType || 'Not specified'}</div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Clinic/Hospital Name:</div>
                  <div className="w-2/3 text-gray-900 dark:text-white">{selectedDoctor.clinicHospitalName || 'Not specified'}</div>
                </div>
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Status:</div>
                  <div className="w-2/3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${
                      selectedDoctor.isApproved
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {selectedDoctor.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
                {selectedDoctor.createdAt && (
                  <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="w-1/3 font-medium text-gray-700 dark:text-gray-300">Joined Date:</div>
                    <div className="w-2/3 text-gray-900 dark:text-white">
                      {new Date(selectedDoctor.createdAt).toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedDoctor.rejectionReason && (
                  <div className="flex items-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mt-2">
                    <div className="w-1/3 font-medium text-red-700 dark:text-red-400">Rejection Reason:</div>
                    <div className="w-2/3 text-red-900 dark:text-red-300">{selectedDoctor.rejectionReason}</div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!selectedDoctor.isApproved ? (
                  <>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to approve this doctor?')) {
                          try {
                            await apiService.approveDoctor(selectedDoctor._id);
                            setShowViewModal(false);
                            fetchDoctors();
                            alert('Doctor approved successfully');
                          } catch (err) {
                            alert(err.response?.data?.message || 'Failed to approve doctor');
                          }
                        }
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleReject(selectedDoctor);
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleDelete(selectedDoctor._id)}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reject Doctor</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">Are you sure you want to reject {selectedDoctor.name}?</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rejection Reason *</label>
                <textarea
                  id="rejectionReason"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoctors;
