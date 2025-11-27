import React, { useState } from 'react';

const PatientRegisterForm = ({ setPatientData }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const validateName = (name) => {
    // Only letters and spaces, at least 2 characters
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email) => {
    // Email validation - only allows .com extension
    // Pattern: localpart@domain.com
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    return emailRegex.test(email.trim());
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Validation based on field type
    if (name === 'fullName') {
      // Only allow letters and spaces
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'email') {
      // Trim email but don't restrict characters (let validation handle it)
      processedValue = value.trim();
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
    if (name === 'fullName' && processedValue && !validateName(processedValue)) {
      error = 'Name must contain only letters and be at least 2 characters';
    } else if (name === 'email' && processedValue && !validateEmail(processedValue)) {
      error = 'Please enter a valid email address ending with .com (e.g., name@example.com)';
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
    }

    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    setPatientData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';
    const trimmedValue = value.trim();

    if (name === 'fullName') {
      if (!trimmedValue) {
        error = 'Full name is required';
      } else if (!validateName(trimmedValue)) {
        error = 'Name must contain only letters and be at least 2 characters';
      }
    } else if (name === 'email') {
      if (!trimmedValue) {
        error = 'Email is required';
      } else if (!validateEmail(trimmedValue)) {
        error = 'Please enter a valid email address ending with .com (e.g., name@example.com)';
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
    <div className="space-y-5" data-lpignore="true" data-form-type="register">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.fullName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Enter your full name"
        />
        {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="register-patient-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="register-patient-email"
          name="email"
          autoComplete="email"
          data-lpignore="true"
          data-form-type="register"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Enter your email address"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="register-patient-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="register-patient-password"
          name="password"
          autoComplete="new-password"
          data-lpignore="true"
          data-form-type="register"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Enter your password"
        />
        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
      </div>
    </div>
  );
};

export default PatientRegisterForm;
