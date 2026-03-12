import React, { useState, useEffect } from 'react';
import PasswordInput from '../forms/PasswordInput';
import { apiService } from '../../api/apiService';

const DoctorRegisterForm = ({ setDoctorData }) => {
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
    confirmPassword: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [termsContent, setTermsContent] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email) => {
    // Email validation - only allows .com extension
    // Pattern: localpart@domain.com
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone) => {
    // Exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    // Get minPasswordLength from settings, default to 6
    let minLength = 6;
    try {
      const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
      if (settings.minPasswordLength) {
        minLength = parseInt(settings.minPasswordLength) || 6;
      }
    } catch (e) {
      // Use default if settings not available
    }
    return password.length >= minLength;
  };

  const validateExperience = (experience) => {
    const exp = parseInt(experience);
    return !isNaN(exp) && exp >= 0 && exp <= 50;
  };

  const validateLicenseNo = (licenseNo) => {
    // Pattern: 2 uppercase letters / 4-digit year (1900-2099) / 5 or 6 digit serial number
    // Examples: TN/2020/123456, MH/2018/54321
    const licenseRegex = /^[A-Z]{2}\/(19|20)\d{2}\/\d{5,6}$/;
    return licenseRegex.test(licenseNo.trim());
  };

  // Fetch Terms & Conditions on mount
  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setIsLoadingTerms(true);
      const response = await apiService.get('/api/terms/current');
      if (response.data.success) {
        setTermsContent(response.data.data.content);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      setTermsContent('Please read and accept our Terms & Conditions to use the platform.');
    } finally {
      setIsLoadingTerms(false);
    }
  };

  const handleTermsAccept = () => {
    setFormData(prev => ({ ...prev, termsAccepted: true }));
    setShowTermsModal(false);
    setDoctorData(prev => ({ ...prev, termsAccepted: true }));
    // Clear error if exists
    if (errors.termsAccepted) {
      setErrors(prev => ({ ...prev, termsAccepted: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    // Validation based on field type
    if (name === 'firstName' || name === 'lastName') {
      // Only allow letters and spaces
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'phone') {
      // Only allow numbers, max 10 digits
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'experience') {
      // Only allow digits (0-9), remove ALL special characters including minus (-), dot (.), plus (+), etc.
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
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Real-time validation
    let error = '';
    if ((name === 'firstName' || name === 'lastName') && processedValue && !validateName(processedValue)) {
      error = 'Name must contain only letters and be at least 2 characters';
    } else if (name === 'email' && processedValue && !validateEmail(processedValue)) {
      error = 'Please enter a valid email address ending with .com (e.g., name@example.com)';
    } else if (name === 'phone' && processedValue && !validatePhone(processedValue)) {
      error = 'Phone number must be exactly 10 digits';
    } else if (name === 'password' && processedValue && !validatePassword(processedValue)) {
      let minLength = 6;
      try {
        const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
        if (settings.minPasswordLength) {
          minLength = parseInt(settings.minPasswordLength) || 6;
        }
      } catch (e) {}
      error = `Password must be at least ${minLength} characters`;
    } else if (name === 'password' && formData.confirmPassword && processedValue !== formData.confirmPassword) {
      // If password changes and confirmPassword exists, check if they match
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else if (name === 'confirmPassword' && processedValue && processedValue !== formData.password) {
      error = 'Passwords do not match';
    } else if (name === 'experience' && processedValue && !validateExperience(processedValue)) {
      error = 'Experience must be between 0 and 50 years';
    } else if (name === 'licenseNo' && processedValue && !validateLicenseNo(processedValue)) {
      error = 'License number must be in format: XX/YYYY/XXXXX (e.g., TN/2020/123456)';
    }

    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    setDoctorData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Validate T&C acceptance
  const validateTerms = () => {
    if (!formData.termsAccepted) {
      setErrors(prev => ({ ...prev, termsAccepted: 'You must accept the Terms & Conditions to register' }));
      return false;
    }
    return true;
  };

  // Expose validation method to parent
  useEffect(() => {
    if (setDoctorData) {
      setDoctorData(prev => ({
        ...prev,
        ...formData,
        validateTerms
      }));
    }
  }, [formData.termsAccepted]);

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';
    const trimmedValue = value.trim();

    if (name === 'firstName' || name === 'lastName') {
      if (!trimmedValue) {
        error = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
      } else if (!validateName(trimmedValue)) {
        error = 'Name must contain only letters and be at least 2 characters';
      }
    } else if (name === 'email') {
      if (!trimmedValue) {
        error = 'Email is required';
      } else if (!validateEmail(trimmedValue)) {
        error = 'Please enter a valid email address ending with .com (e.g., name@example.com)';
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
      if (!trimmedValue) {
        error = 'Specialization is required';
      } else if (trimmedValue.length < 2) {
        error = 'Specialization must be at least 2 characters';
      }
    } else if (name === 'experience') {
      if (!value) {
        error = 'Years of experience is required';
      } else {
        // Check for special characters
        const digitsOnly = value.replace(/[^0-9]/g, '');
        if (digitsOnly !== value.trim()) {
          error = 'Experience must be a number only (no special characters or minus signs)';
        } else if (!validateExperience(value)) {
          const exp = parseInt(value);
          if (exp < 0) {
            error = 'Experience cannot be negative (minimum is 0)';
          } else if (exp > 50) {
            error = 'Experience cannot exceed 50 years';
          } else {
            error = 'Experience must be between 0 and 50 years';
          }
        }
      }
    } else if (name === 'qualification') {
      if (!trimmedValue) {
        error = 'Qualification is required';
      } else if (trimmedValue.length < 2) {
        error = 'Qualification must be at least 2 characters';
      }
    } else if (name === 'location') {
      if (!trimmedValue) {
        error = 'Location is required';
      } else if (trimmedValue.length < 2) {
        error = 'Location must be at least 2 characters';
      }
    } else if (name === 'clinicHospitalType') {
      if (!value) {
        error = 'Please select clinic or hospital';
      }
    } else if (name === 'clinicHospitalName') {
      if (!trimmedValue) {
        error = `${formData.clinicHospitalType === 'clinic' ? 'Clinic' : 'Hospital'} name is required`;
      } else if (trimmedValue.length < 2) {
        error = 'Name must be at least 2 characters';
      }
    } else if (name === 'licenseNo') {
      if (!trimmedValue) {
        error = 'License number is required';
      } else if (!validateLicenseNo(trimmedValue)) {
        error = 'License number must be in format: XX/YYYY/XXXXX (e.g., TN/2020/123456)';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Password is required';
      } else if (!validatePassword(value)) {
        let minLength = 6;
        try {
          const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
          if (settings.minPasswordLength) {
            minLength = parseInt(settings.minPasswordLength) || 6;
          }
        } catch (e) {}
        error = `Password must be at least ${minLength} characters`;
      }
    } else if (name === 'confirmPassword') {
      if (!value) {
        error = 'Please confirm your password';
      } else if (value !== formData.password) {
        error = 'Passwords do not match';
      }
    }

    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  return (
    <div className="space-y-4" data-lpignore="true" data-form-type="register">
      {/* Row 1: First Name & Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.firstName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="First name"
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.lastName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Last name"
          />
          {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
        </div>
      </div>

      {/* Row 2: Email & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="register-doctor-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="register-doctor-email"
            name="email"
            autoComplete="email"
            data-lpignore="true"
            data-form-type="register"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Email address"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            maxLength={10}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="10 digit number"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
      </div>

      {/* Row 3: Gender & Specialization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.gender ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender}</p>}
        </div>
        <div>
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Specialization <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="specialization"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.specialization ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., Cardiology, Neurology"
          />
          {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization}</p>}
        </div>
      </div>

      {/* Row 4: Experience & Qualification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            onBlur={handleBlur}
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
                  handleChange({ target: { name: 'experience', value: digitsOnly } });
                } else if (!isNaN(numValue) && numValue > 50) {
                  handleChange({ target: { name: 'experience', value: '50' } });
                }
              }
            }}
            onInput={(e) => {
              // Additional safety: filter out minus and dot on input event
              const value = e.target.value;
              const digitsOnly = value.replace(/[^0-9]/g, '');
              if (value !== digitsOnly) {
                e.target.value = digitsOnly;
                handleChange({ target: { name: 'experience', value: digitsOnly } });
              }
            }}
            required
            maxLength={2}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.experience ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Years (0-50)"
          />
          {errors.experience && <p className="mt-1 text-xs text-red-500">{errors.experience}</p>}
        </div>
        <div>
          <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Qualification <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="qualification"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.qualification ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., MBBS, MD, MS"
          />
          {errors.qualification && <p className="mt-1 text-xs text-red-500">{errors.qualification}</p>}
        </div>
      </div>

      {/* Row 5: Location & License No */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.location ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Location/city"
          />
          {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
        </div>
        <div>
          <label htmlFor="licenseNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            License Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="licenseNo"
            name="licenseNo"
            value={formData.licenseNo}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            maxLength={15}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.licenseNo ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., TN/2020/123456"
          />
          {errors.licenseNo && <p className="mt-1 text-xs text-red-500">{errors.licenseNo}</p>}
          {!errors.licenseNo && formData.licenseNo && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: 2 uppercase letters / 4-digit year / 5-6 digit number
            </p>
          )}
        </div>
      </div>

      {/* Row 6: Clinic/Hospital Type & Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="clinicHospitalType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="clinicHospitalType"
            name="clinicHospitalType"
            value={formData.clinicHospitalType}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.clinicHospitalType ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select type</option>
            <option value="clinic">Clinic</option>
            <option value="hospital">Hospital</option>
          </select>
          {errors.clinicHospitalType && <p className="mt-1 text-xs text-red-500">{errors.clinicHospitalType}</p>}
        </div>
        <div>
          <label htmlFor="clinicHospitalName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {formData.clinicHospitalType === 'clinic' ? 'Clinic' : formData.clinicHospitalType === 'hospital' ? 'Hospital' : 'Clinic/Hospital'} Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="clinicHospitalName"
            name="clinicHospitalName"
            autoComplete="organization-name"
            data-lpignore="true"
            data-form-type="register"
            value={formData.clinicHospitalName}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={!formData.clinicHospitalType}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.clinicHospitalName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={formData.clinicHospitalType === 'clinic' ? 'Enter clinic name' : formData.clinicHospitalType === 'hospital' ? 'Enter hospital name' : 'Select type first'}
          />
          {errors.clinicHospitalName && <p className="mt-1 text-xs text-red-500">{errors.clinicHospitalName}</p>}
        </div>
      </div>

      {/* Row 7: Password & Confirm Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="register-doctor-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            id="register-doctor-password"
            name="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            hasError={!!errors.password}
            placeholder="Password"
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            hasError={!!errors.confirmPassword}
            placeholder="Confirm password"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="termsAccepted"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={(e) => {
              if (e.target.checked) {
                setShowTermsModal(true);
              } else {
                setFormData(prev => ({ ...prev, termsAccepted: false }));
                setDoctorData(prev => ({ ...prev, termsAccepted: false }));
              }
            }}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="flex-1">
            <label htmlFor="termsAccepted" className="text-sm text-gray-700 dark:text-gray-300">
              I have read and accept the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium"
              >
                Terms & Conditions
              </button>
              {' '}<span className="text-red-500">*</span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-xs text-red-500">{errors.termsAccepted}</p>
            )}
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Terms & Conditions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Please read carefully before accepting
              </p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingTerms ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (
                <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {termsContent}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTermsAccept}
                disabled={isLoadingTerms}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                I Accept Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorRegisterForm;
