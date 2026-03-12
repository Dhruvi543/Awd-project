import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/apiService';
import PasswordInput from '../../components/forms/PasswordInput';

const DoctorSettings = () => {
  const { user, getCurrentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    specialization: user?.specialization || '',
    experience: user?.experience || '',
    qualification: user?.qualification || '',
    location: user?.location || '',
    licenseNo: user?.licenseNo || '',
    clinicHospitalType: user?.clinicHospitalType || '',
    clinicHospitalName: user?.clinicHospitalName || '',
    bookingFee: user?.bookingFee || user?.consultationFee || 500,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        gender: user?.gender || '',
        specialization: user?.specialization || '',
        experience: user?.experience || '',
        qualification: user?.qualification || '',
        location: user?.location || '',
        licenseNo: user?.licenseNo || '',
        clinicHospitalType: user?.clinicHospitalType || '',
        clinicHospitalName: user?.clinicHospitalName || '',
        bookingFee: user?.bookingFee || user?.consultationFee || 500,
      });
    }
  }, [user]);

  // Fetch latest user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (getCurrentUser) {
        try {
          await getCurrentUser();
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, []);

  // Calculate password strength
  useEffect(() => {
    if (passwordData.newPassword) {
      let strength = 0;
      if (passwordData.newPassword.length >= 8) strength++;
      if (/[a-z]/.test(passwordData.newPassword)) strength++;
      if (/[A-Z]/.test(passwordData.newPassword)) strength++;
      if (/[0-9]/.test(passwordData.newPassword)) strength++;
      if (/[^a-zA-Z0-9]/.test(passwordData.newPassword)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [passwordData.newPassword]);

  const validateField = (name, value) => {
    let error = '';
    
    if (name === 'firstName' || name === 'lastName') {
      if (!value || value.trim() === '') {
        error = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
      } else if (!/^[a-zA-Z\s]{2,}$/.test(value)) {
        error = 'Name must contain only letters and be at least 2 characters';
      }
    } else if (name === 'email') {
      if (!value || value.trim() === '') {
        error = 'Email is required';
      } else {
        // Email validation - only allows .com extension
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
        if (!emailRegex.test(value.trim())) {
          error = 'Please enter a valid email address ending with .com (e.g., name@example.com)';
        }
      }
    } else if (name === 'phone') {
      if (value && value.trim() !== '') {
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
          error = 'Phone number must be exactly 10 digits';
        }
      }
    } else if (name === 'experience') {
      if (value && value.trim() !== '') {
        // Only allow digits (0-9), remove all special characters, minus signs, etc.
        const digitsOnly = value.replace(/[^0-9]/g, '');
        if (digitsOnly !== value.trim()) {
          error = 'Experience must be a number only (no special characters or minus signs)';
        } else {
          const exp = parseInt(digitsOnly);
          if (isNaN(exp)) {
            error = 'Experience must be a valid number';
          } else if (exp < 0) {
            error = 'Experience cannot be negative (minimum is 0)';
          } else if (exp > 50) {
            error = 'Experience cannot exceed 50 years';
          }
        }
      }
    } else if (name === 'specialization') {
      if (value && value.trim() !== '' && value.trim().length < 2) {
        error = 'Specialization must be at least 2 characters';
      }
    } else if (name === 'qualification') {
      if (value && value.trim() !== '' && value.trim().length < 2) {
        error = 'Qualification must be at least 2 characters';
      }
    } else if (name === 'location') {
      if (value && value.trim() !== '' && value.trim().length < 2) {
        error = 'Location must be at least 2 characters';
      }
    } else if (name === 'clinicHospitalName') {
      if (value && value.trim() !== '' && value.trim().length < 2) {
        error = 'Name must be at least 2 characters';
      }
    } else if (name === 'licenseNo') {
      if (value && value.trim() !== '') {
        // License number validation - Pattern: XX/YYYY/XXXXX
        const licenseRegex = /^[A-Z]{2}\/(19|20)\d{2}\/\d{5,6}$/;
        if (!licenseRegex.test(value.trim())) {
          error = 'License number must be in format: XX/YYYY/XXXXX (e.g., TN/2020/123456)';
        }
      }
    } else if (name === 'bookingFee') {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) {
        error = 'Booking fee must be a positive number';
      }
    }

    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFieldChange = (name, value) => {
    let processedValue = value;

    // Process value based on field type
    if (name === 'firstName' || name === 'lastName') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'experience') {
      // Only allow digits (0-9), remove ALL special characters including minus (-), dot (.), plus (+), etc.
      // This regex removes everything except digits 0-9
      processedValue = value.replace(/[^0-9]/g, '');
      // Limit to 2 digits
      if (processedValue.length > 2) {
        processedValue = processedValue.slice(0, 2);
      }
      // If value is greater than 50, cap it at 50
      const numValue = parseInt(processedValue);
      if (!isNaN(numValue) && numValue > 50) {
        processedValue = '50';
      }
    } else if (name === 'email') {
      // Trim email but don't restrict characters (let validation handle it)
      processedValue = value.trim();
    } else if (name === 'licenseNo') {
      // Allow uppercase letters, numbers, and slashes only
      // Auto-format: convert to uppercase, allow only valid characters
      processedValue = value.toUpperCase().replace(/[^A-Z0-9\/]/g, '');
    } else if (name === 'bookingFee') {
      processedValue = parseInt(value) || 0;
    }

    setProfileData(prev => ({ ...prev, [name]: processedValue }));
    validateField(name, processedValue);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!profileData.firstName || profileData.firstName.trim() === '') {
      setError('First name is required');
      return;
    }
    if (!profileData.lastName || profileData.lastName.trim() === '') {
      setError('Last name is required');
      return;
    }
    if (!profileData.email || profileData.email.trim() === '') {
      setError('Email is required');
      return;
    }

    // Check for field errors
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    // Frontend validation
    if (profileData.phone && profileData.phone.trim() !== '') {
      const phoneDigits = profileData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        setError('Phone number must contain between 10 and 15 digits');
        return;
      }
    }

    if (profileData.experience && profileData.experience.trim() !== '') {
      // Ensure only digits (0-9), remove all special characters, minus signs, etc.
      const digitsOnly = profileData.experience.replace(/[^0-9]/g, '');
      if (digitsOnly !== profileData.experience.trim()) {
        setError('Experience must be a number only (no special characters or minus signs)');
        return;
      }
      const exp = parseInt(digitsOnly);
      if (isNaN(exp)) {
        setError('Experience must be a valid number');
        return;
      }
      if (exp < 0) {
        setError('Experience cannot be negative (minimum is 0)');
        return;
      }
      if (exp > 50) {
        setError('Experience cannot exceed 50 years');
        return;
      }
    }
    
    try {
      setIsLoading(true);
      // Normalize email and trim all text fields before sending
      const normalizedData = {
        ...profileData,
        email: profileData.email.toLowerCase().trim(),
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        phone: profileData.phone?.trim() || '',
        specialization: profileData.specialization?.trim() || '',
        qualification: profileData.qualification?.trim() || '',
        location: profileData.location?.trim() || '',
        licenseNo: profileData.licenseNo?.trim() || '',
        clinicHospitalName: profileData.clinicHospitalName?.trim() || '',
        bookingFee: profileData.bookingFee !== undefined ? profileData.bookingFee : 500,
      };
      const response = await apiService.updateProfile(normalizedData);
      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        
        // Update local state with response data
        if (response.data.data) {
          const updatedUser = response.data.data;
          setProfileData({
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            email: updatedUser.email || '',
            phone: updatedUser.phone || '',
            gender: updatedUser.gender || '',
            specialization: updatedUser.specialization || '',
            experience: updatedUser.experience || '',
            qualification: updatedUser.qualification || '',
            location: updatedUser.location || '',
            licenseNo: updatedUser.licenseNo || '',
            clinicHospitalType: updatedUser.clinicHospitalType || '',
            clinicHospitalName: updatedUser.clinicHospitalName || '',
            bookingFee: updatedUser.bookingFee !== undefined ? updatedUser.bookingFee : updatedUser.consultationFee !== undefined ? updatedUser.consultationFee : 500,
          });
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Update user context
          if (getCurrentUser) {
            try {
              await getCurrentUser();
            } catch (err) {
              console.error('Error refreshing user:', err);
            }
          }
        }
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.message).join(', ');
        setError(errorMessages);
      } else {
        setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long!');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.data.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStrength(0);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Handle different error cases
      if (error.response?.status === 404) {
        setError('Route not found. Please contact support.');
      } else if (error.response?.status === 401) {
        setError('Current password is incorrect. Please try again.');
      } else if (error.response?.status === 400) {
        setError(error.response?.data?.message || 'Invalid password. Please check your input.');
      } else {
        setError(error.response?.data?.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setError('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    setError('');
    
    try {
      const response = await apiService.deleteAccount();
      if (response.data.success) {
        // Logout user after successful deletion
        await logout();
        // Redirect to home page
        navigate('/');
        // Show success message (optional - since we're redirecting)
        alert('Your account has been deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error.response?.data?.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 dark:text-green-400">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              onClick={() => {
                setActiveTab('profile');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'profile'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Information
            </button>
            <button
              onClick={() => {
                setActiveTab('password');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'password'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
            </button>
            <button
              onClick={() => {
                setActiveTab('delete');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'delete'
                  ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-white dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </button>
          </div>

          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                      title="Change profile picture"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {user?.name || 'Doctor'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email || 'No email'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Doctor Account</p>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        onBlur={(e) => validateField('firstName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.firstName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Enter first name"
                        required
                      />
                      {fieldErrors.firstName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.firstName}</p>
                      )}
                    </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                        value={profileData.lastName}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        onBlur={(e) => validateField('lastName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.lastName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Enter last name"
                    required
                  />
                      {fieldErrors.lastName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.lastName}</p>
                      )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={(e) => {
                          // Normalize email on blur
                          const normalized = e.target.value.toLowerCase().trim();
                          setProfileData(prev => ({ ...prev, email: normalized }));
                          validateField('email', normalized);
                        }}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Enter your email"
                    required
                  />
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                      )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        onBlur={(e) => validateField('phone', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.phone ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Enter 10 digit phone number"
                        maxLength={10}
                        minLength={10}
                        pattern="[0-9]{10}"
                        inputMode="numeric"
                      />
                      {fieldErrors.phone && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.phone}</p>
                      )}
                      {profileData.phone && !fieldErrors.phone && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {profileData.phone.replace(/\D/g, '').length} / 10 digits
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Gender
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        onBlur={(e) => validateField('location', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.location ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Enter your location"
                      />
                      {fieldErrors.location && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.location}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Professional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={profileData.specialization}
                        onChange={(e) => handleFieldChange('specialization', e.target.value)}
                        onBlur={(e) => validateField('specialization', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.specialization ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="e.g., Cardiology, Neurology"
                      />
                      {fieldErrors.specialization && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.specialization}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={profileData.experience}
                        onChange={(e) => handleFieldChange('experience', e.target.value)}
                        onBlur={(e) => validateField('experience', e.target.value)}
                        onKeyDown={(e) => {
                          // Allow: backspace, delete, tab, escape, enter
                          if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                            (e.keyCode === 65 && e.ctrlKey === true) ||
                            (e.keyCode === 67 && e.ctrlKey === true) ||
                            (e.keyCode === 86 && e.ctrlKey === true) ||
                            (e.keyCode === 88 && e.ctrlKey === true) ||
                            // Allow: home, end, left, right, up, down
                            (e.keyCode >= 35 && e.keyCode <= 40)) {
                            return;
                          }
                          // Explicitly block minus sign (-) - keyCode 189 or 109
                          if (e.keyCode === 189 || e.keyCode === 109 || e.key === '-' || e.key === 'Minus') {
                            e.preventDefault();
                            return;
                          }
                          // Explicitly block dot/period (.) - keyCode 190 or 110
                          if (e.keyCode === 190 || e.keyCode === 110 || e.key === '.' || e.key === 'Period') {
                            e.preventDefault();
                            return;
                          }
                          // Block plus sign (+) - keyCode 187 or 107
                          if (e.keyCode === 187 || e.keyCode === 107 || e.key === '+' || e.key === 'Plus') {
                            e.preventDefault();
                            return;
                          }
                          // Block all other special characters - only allow numbers (0-9) from main keyboard or numpad
                          if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          // Prevent pasting non-numeric content
                          e.preventDefault();
                          const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                          // Extract only digits from pasted text, remove minus (-), dot (.), and all special characters
                          const digitsOnly = pastedText.replace(/[^0-9]/g, '').slice(0, 2);
                          if (digitsOnly) {
                            const numValue = parseInt(digitsOnly);
                            if (!isNaN(numValue) && numValue <= 50) {
                              handleFieldChange('experience', digitsOnly);
                            } else if (!isNaN(numValue) && numValue > 50) {
                              handleFieldChange('experience', '50');
                            }
                          }
                        }}
                        onInput={(e) => {
                          // Additional safety: filter out minus and dot on input event
                          const value = e.target.value;
                          const digitsOnly = value.replace(/[^0-9]/g, '');
                          if (value !== digitsOnly) {
                            e.target.value = digitsOnly;
                            handleFieldChange('experience', digitsOnly);
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.experience ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Years (0-50)"
                        maxLength={2}
                      />
                      {fieldErrors.experience && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.experience}</p>
                      )}
                      {!fieldErrors.experience && profileData.experience && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Enter a number between 0 and 50
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Qualification
                      </label>
                      <input
                        type="text"
                        value={profileData.qualification}
                        onChange={(e) => handleFieldChange('qualification', e.target.value)}
                        onBlur={(e) => validateField('qualification', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.qualification ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="e.g., MBBS, MD, MS"
                      />
                      {fieldErrors.qualification && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.qualification}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={profileData.licenseNo}
                        onChange={(e) => handleFieldChange('licenseNo', e.target.value)}
                        onBlur={(e) => validateField('licenseNo', e.target.value)}
                        maxLength={15}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.licenseNo ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="e.g., TN/2020/123456"
                      />
                      {fieldErrors.licenseNo && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.licenseNo}</p>
                      )}
                      {!fieldErrors.licenseNo && profileData.licenseNo && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Format: 2 uppercase letters / 4-digit year / 5-6 digit number
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Clinic/Hospital Type
                      </label>
                      <select
                        value={profileData.clinicHospitalType}
                        onChange={(e) => setProfileData({ ...profileData, clinicHospitalType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select type</option>
                        <option value="clinic">Clinic</option>
                        <option value="hospital">Hospital</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {profileData.clinicHospitalType === 'clinic' ? 'Clinic' : profileData.clinicHospitalType === 'hospital' ? 'Hospital' : 'Clinic/Hospital'} Name
                      </label>
                      <input
                        type="text"
                        value={profileData.clinicHospitalName}
                        onChange={(e) => handleFieldChange('clinicHospitalName', e.target.value)}
                        onBlur={(e) => validateField('clinicHospitalName', e.target.value)}
                        disabled={!profileData.clinicHospitalType}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          fieldErrors.clinicHospitalName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder={profileData.clinicHospitalType === 'clinic' ? 'Enter clinic name' : profileData.clinicHospitalType === 'hospital' ? 'Enter hospital name' : 'Select type first'}
                      />
                      {fieldErrors.clinicHospitalName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.clinicHospitalName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Booking Fee (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={profileData.bookingFee === 0 ? '' : profileData.bookingFee}
                        onChange={(e) => handleFieldChange('bookingFee', e.target.value)}
                        onBlur={(e) => validateField('bookingFee', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          fieldErrors.bookingFee ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="e.g., 500"
                        min="0"
                        required
                      />
                      {fieldErrors.bookingFee && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.bookingFee}</p>
                      )}
                      {!fieldErrors.bookingFee && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          This is the total fee you charge patients. A percentage (set by admin) will be collected online by the platform to secure the appointment. You collect the remaining amount directly from the patient at the clinic.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        gender: user?.gender || '',
                        specialization: user?.specialization || '',
                        experience: user?.experience || '',
                        qualification: user?.qualification || '',
                        location: user?.location || '',
                        licenseNo: user?.licenseNo || '',
                        clinicHospitalType: user?.clinicHospitalType || '',
                        clinicHospitalName: user?.clinicHospitalName || '',
                        bookingFee: user?.bookingFee || user?.consultationFee || 500,
                      });
                      setFieldErrors({});
                      setError('');
                      setSuccess('');
                    }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                <button
                  type="submit"
                    disabled={isLoading || Object.keys(fieldErrors).length > 0}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Update Profile
                      </>
                    )}
                </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Ensure your account is using a strong, unique password for better security.
                  </p>

                  <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password <span className="text-red-500">*</span>
                  </label>
                  <PasswordInput
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter your current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password <span className="text-red-500">*</span>
                  </label>
                  <PasswordInput
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password (min 6 characters)"
                    required
                        minLength={6}
                      />
                      {passwordData.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Password strength:</span>
                            <span className={`text-xs font-medium ${
                              passwordStrength <= 2 ? 'text-red-600 dark:text-red-400' :
                              passwordStrength <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                              passwordStrength <= 4 ? 'text-blue-600 dark:text-blue-400' :
                              'text-green-600 dark:text-green-400'
                            }`}>
                              {getPasswordStrengthLabel()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                              style={{ width: `${(passwordStrength / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <PasswordInput
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        hasError={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
                        placeholder="Confirm your new password"
                    required
                        minLength={6}
                  />
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordStrength(0);
                      setError('');
                      setSuccess('');
                    }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                <button
                  type="submit"
                    disabled={isLoading || passwordData.newPassword !== passwordData.confirmPassword || passwordData.newPassword.length < 6}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Changing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Change Password
                      </>
                    )}
                </button>
                </div>
              </form>
            )}

            {/* Delete Account Tab */}
            {activeTab === 'delete' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Account
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Warning: This action cannot be undone</h4>
                        <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                          Deleting your account will permanently remove all your data including:
                        </p>
                        <ul className="text-sm text-red-800 dark:text-red-300 list-disc list-inside space-y-1 mb-4">
                          <li>Your profile information</li>
                          <li>All your appointments (pending appointments will be cancelled)</li>
                          <li>All reviews associated with your account</li>
                          <li>All your availability schedules</li>
                          <li>All notifications</li>
                        </ul>
                        <p className="text-sm font-medium text-red-900 dark:text-red-400">
                          This action is permanent and cannot be reversed. Please make sure you want to proceed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!showDeleteConfirm ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        I want to delete my account
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm:
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          placeholder="Type DELETE to confirm"
                        />
                        {deleteConfirmText && deleteConfirmText.toLowerCase() !== 'delete' && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            Please type exactly "DELETE" to confirm
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                            setError('');
                          }}
                          disabled={isDeleting}
                          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'delete'}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          {isDeleting ? (
                            <>
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete My Account
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSettings;
