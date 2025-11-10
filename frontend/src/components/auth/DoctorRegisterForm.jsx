import React, { useState } from 'react';

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
  });

  const [errors, setErrors] = useState({});

  // License number options (you can add more as needed)
  const licenseOptions = [
    'LIC-001',
    'LIC-002',
    'LIC-003',
    'LIC-004',
    'LIC-005',
    'LIC-006',
    'LIC-007',
    'LIC-008',
    'LIC-009',
    'LIC-010',
  ];

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateExperience = (experience) => {
    const exp = parseInt(experience);
    return !isNaN(exp) && exp >= 0 && exp <= 50;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Validation based on field type
    if (name === 'firstName' || name === 'lastName') {
      // Only allow letters and spaces
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'phone') {
      // Only allow numbers, max 10 digits
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'experience') {
      // Only allow numbers
      processedValue = value.replace(/\D/g, '');
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
      error = 'Please enter a valid email address';
    } else if (name === 'phone' && processedValue && !validatePhone(processedValue)) {
      error = 'Phone number must be exactly 10 digits';
    } else if (name === 'password' && processedValue && !validatePassword(processedValue)) {
      error = 'Password must be at least 6 characters';
    } else if (name === 'password' && formData.confirmPassword && processedValue !== formData.confirmPassword) {
      // If password changes and confirmPassword exists, check if they match
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else if (name === 'confirmPassword' && processedValue && processedValue !== formData.password) {
      error = 'Passwords do not match';
    } else if (name === 'experience' && processedValue && !validateExperience(processedValue)) {
      error = 'Experience must be between 0 and 50 years';
    }

    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    setDoctorData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';

    if (name === 'firstName' || name === 'lastName') {
      if (!value) {
        error = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
      } else if (!validateName(value)) {
        error = 'Name must contain only letters and be at least 2 characters';
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
      } else if (value.length < 2) {
        error = 'Specialization must be at least 2 characters';
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
      } else if (value.length < 2) {
        error = 'Qualification must be at least 2 characters';
      }
    } else if (name === 'location') {
      if (!value) {
        error = 'Location is required';
      } else if (value.length < 2) {
        error = 'Location must be at least 2 characters';
      }
    } else if (name === 'clinicHospitalType') {
      if (!value) {
        error = 'Please select clinic or hospital';
      }
    } else if (name === 'clinicHospitalName') {
      if (!value) {
        error = `${formData.clinicHospitalType === 'clinic' ? 'Clinic' : 'Hospital'} name is required`;
      } else if (value.length < 2) {
        error = 'Name must be at least 2 characters';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Password is required';
      } else if (!validatePassword(value)) {
        error = 'Password must be at least 6 characters';
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
            type="number"
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            min="0"
            max="50"
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
            License Number <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <select
            id="licenseNo"
            name="licenseNo"
            value={formData.licenseNo}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.licenseNo ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select license number (optional)</option>
            {licenseOptions.map((license) => (
              <option key={license} value={license}>
                {license}
              </option>
            ))}
          </select>
          {errors.licenseNo && <p className="mt-1 text-xs text-red-500">{errors.licenseNo}</p>}
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
          <input
            type="password"
            id="register-doctor-password"
            name="password"
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="register"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Password"
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
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
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Confirm password"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  );
};

export default DoctorRegisterForm;
