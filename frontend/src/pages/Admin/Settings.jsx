import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { apiService } from '../../api/apiService';
import { useAuth } from '../../contexts/AuthContext';
import PasswordInput from '../../components/forms/PasswordInput';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const settingsTopRef = useRef(null);

  // Scroll to top immediately when component mounts (before paint)
  useLayoutEffect(() => {
    // Remove any hash from URL that might cause scrolling
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    // Force scroll to top immediately
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Scroll to top after settings are loaded
  useEffect(() => {
    if (settings) {
      // Multiple attempts to ensure scroll works
      const scrollToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (settingsTopRef.current) {
          settingsTopRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      };
      
      // Immediate scroll
      scrollToTop();
      
      // Also try after a small delay to ensure DOM is ready
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 200);
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getSettings();
      if (response.data.success) {
        setSettings(response.data.data);
        setFormData(response.data.data);
        // Store settings in localStorage for use across the app
        localStorage.setItem('siteSettings', JSON.stringify(response.data.data));
        // Update page title
        if (response.data.data.siteName) {
          document.title = `${response.data.data.siteName} - Admin Dashboard`;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const fieldsToValidate = ['siteName', 'siteDescription', 'maxAppointmentsPerDay', 'appointmentDuration', 'minPasswordLength', 'sessionTimeout'];
    let hasErrors = false;
    
    fieldsToValidate.forEach(field => {
      if (formData[field] !== undefined) {
        if (!validateField(field, formData[field])) {
          hasErrors = true;
        }
      }
    });
    
    // Ensure required fields are present
    if (!formData.siteName || formData.siteName.trim().length === 0) {
      setErrors(prev => ({ ...prev, siteName: 'Site name is required' }));
      hasErrors = true;
    }
    
    if (!formData.siteDescription || formData.siteDescription.trim().length === 0) {
      setErrors(prev => ({ ...prev, siteDescription: 'Site description is required' }));
      hasErrors = true;
    }
    
    if (hasErrors) {
      setError('Please fix validation errors before saving');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      setErrors({});
      
      // Prepare data to send - ensure all fields are included
      const dataToSave = {
        siteName: formData.siteName?.trim() || '',
        siteDescription: formData.siteDescription?.trim() || '',
        maxAppointmentsPerDay: formData.maxAppointmentsPerDay || 10,
        appointmentDuration: formData.appointmentDuration || 30,
        workingHoursStart: formData.workingHoursStart || '09:00',
        workingHoursEnd: formData.workingHoursEnd || '17:00',
        platformCommissionPercentage: formData.platformCommissionPercentage || 20,
        minPasswordLength: formData.minPasswordLength || 6,
        sessionTimeout: formData.sessionTimeout || 30,
        allowRegistration: formData.allowRegistration !== undefined ? formData.allowRegistration : true,
        autoApproveDoctors: formData.autoApproveDoctors !== undefined ? formData.autoApproveDoctors : false,
        requireEmailVerification: formData.requireEmailVerification !== undefined ? formData.requireEmailVerification : false,
        maintenanceMode: formData.maintenanceMode !== undefined ? formData.maintenanceMode : false,
      };
      
      console.log('Saving settings:', dataToSave); // Debug log
      
      const response = await apiService.updateSettings(dataToSave);
      if (response.data.success) {
        setSettings(response.data.data);
        setFormData(response.data.data); // Update form data with response
        // Store updated settings in localStorage for use across the app
        localStorage.setItem('siteSettings', JSON.stringify(response.data.data));
        // Trigger storage event so other components can update
        window.dispatchEvent(new Event('storage'));
        setSuccess('Settings saved successfully! Changes are now permanent and will persist after refresh/logout.');
        // Update page title if siteName changed
        if (response.data.data.siteName) {
          document.title = `${response.data.data.siteName} - Admin Dashboard`;
        }
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const validateField = (name, value) => {
    let error = '';
    
    if (name === 'maxAppointmentsPerDay') {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 1000) {
        error = 'Max appointments per day must be between 1 and 1000';
      }
    } else if (name === 'appointmentDuration') {
      const num = parseInt(value);
      if (isNaN(num) || num < 5 || num > 480) {
        error = 'Appointment duration must be between 5 and 480 minutes';
      }
    } else if (name === 'platformCommissionPercentage') {
      const num = parseInt(value);
      if (isNaN(num) || num < 0 || num > 100) {
        error = 'Platform fee percentage must be between 0 and 100';
      }
    } else if (name === 'minPasswordLength') {
      const num = parseInt(value);
      if (isNaN(num) || num < 6 || num > 20) {
        error = 'Minimum password length must be between 6 and 20';
      }
    } else if (name === 'sessionTimeout') {
      const num = parseInt(value);
      if (isNaN(num) || num < 5 || num > 1440) {
        error = 'Session timeout must be between 5 and 1440 minutes';
      }
    } else if (name === 'siteName') {
      if (!value || value.trim().length === 0) {
        error = 'Site name is required';
      }
    } else if (name === 'siteDescription') {
      if (!value || value.trim().length === 0) {
        error = 'Site description is required';
      }
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    return !error;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const processedValue = type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value);
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Validate on change
    if (type !== 'checkbox') {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-full">
        <div className="max-w-full">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure system settings and preferences</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Settings Form */}
        {settings && (
          <form onSubmit={handleSubmit} className="space-y-6" id="settings-form" ref={settingsTopRef}>
            {/* General Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">General Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure basic site information and branding</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Site Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="siteName"
                    value={formData.siteName || ''}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g., DOXI Healthcare Platform"
                    required
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.siteName 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.siteName && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.siteName}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Appears in browser tab title, page headers, and sidebar
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Site Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="siteDescription"
                    value={formData.siteDescription || ''}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Your trusted healthcare appointment platform"
                    required
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.siteDescription 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.siteDescription && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.siteDescription}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Used in meta tags for SEO, email footers, and system descriptions
                  </p>
                </div>
              </div>

              {/* Payment Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Platform Fee Percentage (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="platformCommissionPercentage"
                    value={formData.platformCommissionPercentage === 0 ? 0 : (formData.platformCommissionPercentage || '')}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min="0"
                    max="100"
                    placeholder="e.g., 20"
                    required
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.platformCommissionPercentage 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.platformCommissionPercentage && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.platformCommissionPercentage}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Percentage of booking fee collected online by the platform. Doctors collect the remaining amount at the clinic.
                  </p>
                </div>
              </div>
              
              {/* Save Button for General Settings - Prominent and Visible */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fetchSettings}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Appointment Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Appointment Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Appointments Per Day <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="maxAppointmentsPerDay"
                    value={formData.maxAppointmentsPerDay || ''}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min="1"
                    max="1000"
                    required
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.maxAppointmentsPerDay 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.maxAppointmentsPerDay && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.maxAppointmentsPerDay}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 1-1000 appointments</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Appointment Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="appointmentDuration"
                    value={formData.appointmentDuration || ''}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min="5"
                    max="480"
                    required
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.appointmentDuration 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.appointmentDuration && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.appointmentDuration}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 5-480 minutes (8 hours max)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Working Hours Start</label>
                  <input
                    type="time"
                    name="workingHoursStart"
                    value={formData.workingHoursStart || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Working Hours End</label>
                  <input
                    type="time"
                    name="workingHoursEnd"
                    value={formData.workingHoursEnd || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">System Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowRegistration"
                    checked={formData.allowRegistration || false}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow User Registration
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="autoApproveDoctors"
                    checked={formData.autoApproveDoctors || false}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-Approve New Doctors
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireEmailVerification"
                    checked={formData.requireEmailVerification || false}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Require Email Verification
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={formData.maintenanceMode || false}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maintenance Mode
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                <strong>Allow Registration:</strong> Enable/disable new user registrations<br/>
                <strong>Auto-Approve Doctors:</strong> Automatically approve new doctor registrations<br/>
                <strong>Require Email Verification:</strong> Require email verification before account activation<br/>
                <strong>Maintenance Mode:</strong> Put the system in maintenance mode (blocks all access)
              </p>
            </div>

            {/* Security Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Security Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Password Length <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="minPasswordLength"
                    value={formData.minPasswordLength || 6}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min="6"
                    max="20"
                    required
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.minPasswordLength 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.minPasswordLength && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.minPasswordLength}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 6-20 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Session Timeout (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="sessionTimeout"
                    value={formData.sessionTimeout || 30}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min="5"
                    max="1440"
                    required
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.sessionTimeout 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.sessionTimeout && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.sessionTimeout}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 5-1440 minutes (24 hours max)</p>
                </div>
              </div>
            </div>

            {/* Additional Save Button at Bottom - Sticky Option */}
            <div className="sticky bottom-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 flex justify-end gap-3 z-10">
              <button
                type="button"
                onClick={fetchSettings}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Reset All
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving All Changes...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save All Settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Account Settings - Email and Password */}
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your account email and password</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Update Email */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Update Email</h3>
              </div>
              <EmailUpdateForm />
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h3>
              </div>
              <PasswordUpdateForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Email Update Form Component
const EmailUpdateForm = () => {
  const [step, setStep] = useState(1); // 1: Verify password, 2: Change email
  const [formData, setFormData] = useState({
    currentEmail: '',
    newEmail: '',
    password: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});
  const { user, getCurrentUser } = useAuth();

  useEffect(() => {
    // Load current email from user context
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        currentEmail: user.email,
        newEmail: '',
        password: '',
      }));
    }
  }, [user]);

  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) {
      return { valid: false, message: 'Email is required' };
    }
    // Email validation - only allows .com extension
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, message: 'Please enter a valid email address ending with .com (e.g., name@example.com)' };
    }
    if (email.length > 254) {
      return { valid: false, message: 'Email address is too long (max 254 characters)' };
    }
    return { valid: true, message: '' };
  };

  // Step 1: Verify password
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    
    if (!formData.password) {
      setErrors({ password: 'Password is required' });
      return;
    }
    
    try {
      setIsVerifying(true);
      setError(null);
      const response = await apiService.verifyAdminPassword({ password: formData.password });
      if (response.data.success) {
        setStep(2); // Move to step 2
        setSuccess('Password verified successfully. You can now change your email.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password wrong or not match');
      setErrors({ password: 'Password wrong or not match' });
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Update email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    
    // Validate new email
    const emailValidation = validateEmail(formData.newEmail);
    if (!emailValidation.valid) {
      setErrors({ newEmail: emailValidation.message });
      return;
    }
    
    // Check if new email is different from current
    if (formData.newEmail.toLowerCase().trim() === formData.currentEmail.toLowerCase().trim()) {
      setErrors({ newEmail: 'New email must be different from current email' });
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const response = await apiService.updateAdminEmail({
        email: formData.newEmail.trim().toLowerCase(),
        password: formData.password, // Already verified in step 1
      });
      if (response.data.success) {
        setSuccess('Email address updated successfully!');
        // Update user in localStorage
        const updatedUser = { ...user, email: response.data.data.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Reset form and go back to step 1
        setFormData({
          currentEmail: response.data.data.email,
          newEmail: '',
          password: '',
        });
        setStep(1);
        // Try to refresh user from context
        if (getCurrentUser) {
          try {
            await getCurrentUser();
          } catch (err) {
            console.error('Failed to refresh user:', err);
          }
        }
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update email address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({
      currentEmail: user?.email || '',
      newEmail: '',
      password: '',
    });
    setError(null);
    setSuccess(null);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Real-time validation for email field
    if (name === 'newEmail' && value) {
      const emailValidation = validateEmail(value);
      if (!emailValidation.valid) {
        setErrors(prev => ({ ...prev, newEmail: emailValidation.message }));
      } else if (value.toLowerCase().trim() === formData.currentEmail.toLowerCase().trim()) {
        setErrors(prev => ({ ...prev, newEmail: 'New email must be different from current email' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.newEmail;
          return newErrors;
        });
      }
    }
  };

  return (
    <form onSubmit={step === 1 ? handleVerifyPassword : handleUpdateEmail} className="space-y-5">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{success}</span>
          </div>
        </div>
      )}
      
      {step === 1 ? (
        // Step 1: Verify Password
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Step 1 of 2: Verify your identity by entering your current password
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your current password"
              autoFocus
              hasError={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Enter your current password to verify your identity</p>
          </div>
        </div>
      ) : (
        // Step 2: Change Email
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 px-4 py-3 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Step 2 of 2: Password verified. You can now change your email address.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
              >
                Start over
              </button>
            </div>
          </div>

          {/* Current Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Current Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.currentEmail}
                readOnly
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Your current registered email address</p>
          </div>

          {/* New Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              New Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                name="newEmail"
                value={formData.newEmail}
                onChange={handleInputChange}
                required
                placeholder="Enter your new email address"
                autoFocus
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.newEmail 
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.newEmail && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.newEmail}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Enter a valid email address that you have access to</p>
          </div>

        </div>
      )}

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={
            step === 1 
              ? (isVerifying || !formData.password)
              : (isSaving || !formData.newEmail)
          }
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center"
        >
          {step === 1 ? (
            isVerifying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Password...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verify Password
              </>
            )
          ) : (
            isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Email Address...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Update Email Address
              </>
            )
          )}
        </button>
      </div>
    </form>
  );
};

// Password Update Form Component
const PasswordUpdateForm = () => {
  const [step, setStep] = useState(1); // 1: Verify password, 2: Change password
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});

  // Step 1: Verify password
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    
    if (!formData.currentPassword) {
      setErrors({ currentPassword: 'Password is required' });
      return;
    }
    
    try {
      setIsVerifying(true);
      setError(null);
      const response = await apiService.verifyAdminPassword({ password: formData.currentPassword });
      if (response.data.success) {
        setStep(2); // Move to step 2
        setSuccess('Password verified successfully. You can now change your password.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password wrong or not match');
      setErrors({ currentPassword: 'Password wrong or not match' });
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    
    // Validate new password
    if (!formData.newPassword) {
      setErrors({ newPassword: 'New password is required' });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setErrors({ newPassword: 'Password must be at least 6 characters' });
      return;
    }
    
    // Validate confirm password
    if (!formData.confirmPassword) {
      setErrors({ confirmPassword: 'Please confirm your new password' });
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      setErrors({ newPassword: 'New password must be different from current password' });
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const response = await apiService.updateAdminPassword({
        currentPassword: formData.currentPassword, // Already verified in step 1
        newPassword: formData.newPassword,
      });
      if (response.data.success) {
        setSuccess('Password updated successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setStep(1); // Reset to step 1
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError(null);
    setSuccess(null);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Validate password match in real-time
    if (name === 'confirmPassword' && formData.newPassword && value !== formData.newPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else if (name === 'confirmPassword' && value === formData.newPassword) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={step === 1 ? handleVerifyPassword : handleUpdatePassword} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{success}</span>
          </div>
        </div>
      )}
      
      {step === 1 ? (
        // Step 1: Verify Password
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Step 1 of 2: Verify your identity by entering your current password
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              required
              placeholder="Enter your current password"
              autoFocus
              hasError={!!errors.currentPassword}
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.currentPassword}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Enter your current password to verify your identity</p>
          </div>
        </div>
      ) : (
        // Step 2: Change Password
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 px-4 py-3 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Step 2 of 2: Password verified. You can now change your password.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
              >
                Start over
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              required
              minLength={6}
              placeholder="Enter new password (min 6 characters)"
              autoFocus
              hasError={!!errors.newPassword}
            />
            {errors.newPassword && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.newPassword}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Minimum 6 characters required</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              minLength={6}
              placeholder="Confirm new password"
              hasError={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.confirmPassword}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Re-enter the password to confirm</p>
          </div>
        </div>
      )}
      
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={
            step === 1 
              ? (isVerifying || !formData.currentPassword)
              : (isSaving || !formData.newPassword || !formData.confirmPassword)
          }
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center"
        >
          {step === 1 ? (
            isVerifying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Password...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verify Password
              </>
            )
          ) : (
            isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Changing Password...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </>
            )
          )}
        </button>
      </div>
    </form>
  );
};

export default AdminSettings;
