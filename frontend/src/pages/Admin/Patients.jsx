import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import PasswordInput from '../../components/forms/PasswordInput';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [genderFilter, setGenderFilter] = useState('all');
  const [activationFilter, setActivationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    totalAppointments: 0
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

  // Sync search term from URL
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, [currentPage, searchTerm, genderFilter, activationFilter]);
  
  const fetchStats = async () => {
    try {
      const response = await apiService.getAdminStats();
      if (response.data.success) {
        const data = response.data.data;
        setStats({
          total: data.totalPatients || 0,
          male: 0, // Will be calculated from patients
          female: 0, // Will be calculated from patients
          totalAppointments: data.totalAppointments || 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
      };
      const response = await apiService.getAllPatients(params);
      if (response.data.success) {
        let filteredPatients = response.data.data;
        // Client-side filter for activation status
        if (activationFilter !== 'all') {
          filteredPatients = filteredPatients.filter(patient =>
            activationFilter === 'active' ? !patient.isDeleted : patient.isDeleted
          );
        }
        setPatients(filteredPatients);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name);
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

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleCreate = () => {
    setSelectedPatient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: '',
      password: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      gender: patient.gender || '',
      password: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const handleToggleStatus = (patient) => {
    const isActive = !patient.isDeleted;
    const action = isActive ? 'deactivate' : 'activate';
    const actionPast = isActive ? 'deactivated' : 'activated';

    setConfirmModal({
      isOpen: true,
      title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Are you sure you want to ${action} this patient?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: isActive ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          if (isActive) {
            await apiService.deletePatient(patient._id);
          } else {
            await apiService.restorePatient(patient._id);
          }
          fetchPatients();
          setConfirmModal(prev => ({
            ...prev,
            isOpen: true,
            title: 'Success',
            message: `Patient ${actionPast} successfully`,
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
            message: err.response?.data?.message || `Failed to ${action} patient`,
            confirmText: 'OK',
            cancelText: '',
            type: 'danger',
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
          }));
        }
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (!validateName(formData.name)) {
      if (/\d/.test(formData.name)) {
        newErrors.name = 'Name cannot contain numbers';
      } else {
        newErrors.name = 'Name must contain only letters and be at least 2 characters';
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

    // Password validation (only for new patients)
    if (!selectedPatient) {
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
      if (selectedPatient) {
        // Update
        await apiService.updatePatient(selectedPatient._id, formData);
        alert('Patient updated successfully');
      } else {
        // Create
        await apiService.createPatient(formData);
        alert('Patient created successfully');
      }
      setShowModal(false);
      setErrors({});
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save patient');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Only block numbers for phone field
    if (name === 'phone') {
      // Only allow numbers, max 10 digits
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    // For name field, don't block numbers, but validate and show errors

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Clear error when user starts typing (only if field becomes valid)
    if (errors[name]) {
      // Check if the field is now valid
      let isValid = true;
      if (name === 'name' && processedValue && !validateName(processedValue)) {
        isValid = false;
      }
      
      if (isValid) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }

    // Real-time validation
    let error = '';
    if (name === 'name' && processedValue) {
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
    }

    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';

    if (name === 'name') {
      if (!value) {
        error = 'Name is required';
      } else if (!validateName(value)) {
        if (/\d/.test(value)) {
          error = 'Name cannot contain numbers';
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
    } else if (name === 'password' && !selectedPatient) {
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
    <div className="w-full max-w-full">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Patient Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and oversee all patients on the platform</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Patient
            </button>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Male</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{patients.filter(p => p.gender === 'male').length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Female</p>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-1">{patients.filter(p => p.gender === 'female').length}</p>
                </div>
                <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
                placeholder="Search by name, email, or phone..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activation Status</label>
              <select
                value={activationFilter}
                onChange={(e) => {
                  setActivationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchPatients}
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

        {/* Patients Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No patients found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {patients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{patient.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            ID: {patient._id?.slice(-6) || 'Not available'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{patient.email}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Joined: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Not available'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{patient.phone || 'No phone'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {patient.email ? 'Email verified' : 'Not verified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {patient.gender ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              patient.gender === 'male' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              patient.gender === 'female' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not specified</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block w-fit ${
                            patient.isDeleted
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {patient.isDeleted ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(patient)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(patient)}
                              className={`${
                                patient.isDeleted
                                  ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                                  : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                              }`}
                              title={patient.isDeleted ? 'Activate' : 'Deactivate'}
                            >
                              {patient.isDeleted ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
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
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} patients
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

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedPatient ? 'Edit Patient' : 'Add New Patient'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Full name"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
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
                {!selectedPatient && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <PasswordInput
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      hasError={!!errors.password}
                      placeholder="Password (min 6 characters)"
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                  </div>
                )}
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
                    {selectedPatient ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowViewModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPatient.name}</p>
                </div>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedPatient.email}</p>
                </div>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedPatient.phone || 'Not provided'}</p>
                </div>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gender</p>
                  {selectedPatient.gender ? (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${
                      selectedPatient.gender === 'male' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      selectedPatient.gender === 'female' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not specified</span>
                  )}
                </div>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Role</p>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedPatient.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Registered On</p>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleString() : 'Not available'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
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

export default AdminPatients;
