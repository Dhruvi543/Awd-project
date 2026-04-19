import React, { useMemo, useState } from 'react';
import { apiService } from '../../api/apiService';
import { useAuth } from '../../contexts/AuthContext';

const initialPatientData = {
  role: 'patient',
  name: '',
};

const initialDoctorData = {
  role: 'doctor',
  firstName: '',
  lastName: '',
  phone: '',
  gender: '',
  specialization: '',
  experience: '',
  qualification: '',
  location: '',
  licenseNo: '',
  clinicHospitalType: '',
  clinicHospitalName: '',
  termsAccepted: false,
};

const ProfileCompletionPrompt = ({ onClose, onComplete, allowClose = true }) => {
  const { user, getCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(() => {
    if (user?.role === 'doctor') {
      return {
        ...initialDoctorData,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        gender: user?.gender || '',
        specialization: user?.specialization || '',
        experience: user?.experience || '',
        qualification: user?.qualification || '',
        location: user?.location || '',
        licenseNo: user?.licenseNo || '',
        clinicHospitalType: user?.clinicHospitalType || '',
        clinicHospitalName: user?.clinicHospitalName || '',
      };
    }

    return {
      ...initialPatientData,
      name: user?.name || '',
    };
  });

  const isDoctor = formData.role === 'doctor';

  const title = useMemo(() => {
    return user?.authProvider === 'google' ? 'Complete Your Registration' : 'Complete Your Profile';
  }, [user?.authProvider]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === 'checkbox' ? checked : value;

    if (name === 'phone') {
      nextValue = value.replace(/\D/g, '').slice(0, 10);
    }

    if (name === 'experience') {
      nextValue = value.replace(/[^0-9]/g, '').slice(0, 2);
      if (nextValue && Number(nextValue) > 50) {
        nextValue = '50';
      }
    }

    if (name === 'licenseNo') {
      nextValue = value.toUpperCase().replace(/[^A-Z0-9/]/g, '');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (e) => {
    const nextRole = e.target.value;
    setErrors({});

    if (nextRole === 'doctor') {
      const nameParts = (formData.name || user?.name || '').trim().split(/\s+/).filter(Boolean);
      setFormData({
        ...initialDoctorData,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' '),
      });
      return;
    }

    const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim() || user?.name || '';
    setFormData({
      ...initialPatientData,
      name: fullName,
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.role) {
      nextErrors.role = 'Please select a role';
    }

    if (!isDoctor) {
      if (!formData.name?.trim() || formData.name.trim().length < 2) {
        nextErrors.name = 'Full name is required';
      }
    }

    if (isDoctor) {
      const requiredFields = {
        firstName: 'First name is required',
        lastName: 'Last name is required',
        phone: 'Phone number is required',
        gender: 'Gender is required',
        specialization: 'Specialization is required',
        experience: 'Experience is required',
        qualification: 'Qualification is required',
        location: 'Full address is required',
        licenseNo: 'License number is required',
        clinicHospitalType: 'Please select clinic or hospital',
        clinicHospitalName: 'Clinic or hospital name is required',
      };

      Object.entries(requiredFields).forEach(([field, message]) => {
        if (!formData[field]?.toString().trim()) {
          nextErrors[field] = message;
        }
      });

      if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
        nextErrors.phone = 'Phone number must be exactly 10 digits';
      }

      if (formData.experience && (Number(formData.experience) < 0 || Number(formData.experience) > 50)) {
        nextErrors.experience = 'Experience must be between 0 and 50 years';
      }

      if (formData.licenseNo && !/^[A-Z]{2}\/(19|20)\d{2}\/\d{5,6}$/.test(formData.licenseNo)) {
        nextErrors.licenseNo = 'License number must be in format XX/YYYY/XXXXX';
      }

      if (!formData.termsAccepted) {
        nextErrors.termsAccepted = 'You must accept the Terms & Conditions';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload = {
        role: formData.role,
        profileComplete: true,
      };

      if (isDoctor) {
        Object.assign(payload, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          gender: formData.gender,
          specialization: formData.specialization.trim(),
          experience: formData.experience.trim(),
          qualification: formData.qualification.trim(),
          location: formData.location.trim(),
          licenseNo: formData.licenseNo.trim(),
          clinicHospitalType: formData.clinicHospitalType,
          clinicHospitalName: formData.clinicHospitalName.trim(),
          termsAccepted: true,
        });
      } else {
        payload.name = formData.name.trim();
      }

      const response = await apiService.updateProfile(payload);
      await getCurrentUser();

      if (onComplete) {
        onComplete(response.data);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const mappedErrors = {};
        apiErrors.forEach((item) => {
          mappedErrors[item.field] = item.message;
        });
        setErrors(mappedErrors);
      } else {
        setErrors({
          submit: error.response?.data?.message || 'Failed to save your details. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-2.761 2.239-5 5-5m-5 5c0 2.761-2.239 5-5 5m5-5v10m0-10C9.239 11 7 8.761 7 6m10 12a5 5 0 01-5 5m5-5a5 5 0 00-5-5m0 10a5 5 0 01-5-5m5 5a5 5 0 00-5 5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Please fill in the required details before we continue to your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="google-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Continue as
              </label>
              <select
                id="google-role"
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
            </div>

            {!isDoctor && (
              <div>
                <label htmlFor="google-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="google-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
            )}

            {isDoctor && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} maxLength={10} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specialization <span className="text-red-500">*</span>
                    </label>
                    <input id="specialization" name="specialization" type="text" value={formData.specialization} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.specialization ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.specialization && <p className="mt-1 text-sm text-red-500">{errors.specialization}</p>}
                  </div>
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Experience <span className="text-red-500">*</span>
                    </label>
                    <input id="experience" name="experience" type="text" value={formData.experience} onChange={handleChange} maxLength={2} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.experience ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.experience && <p className="mt-1 text-sm text-red-500">{errors.experience}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <input id="qualification" name="qualification" type="text" value={formData.qualification} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.qualification ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.qualification && <p className="mt-1 text-sm text-red-500">{errors.qualification}</p>}
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Clinic/Hospital Address <span className="text-red-500">*</span>
                    </label>
                    <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} placeholder="Enter complete clinic/hospital address" className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="licenseNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      License Number <span className="text-red-500">*</span>
                    </label>
                    <input id="licenseNo" name="licenseNo" type="text" value={formData.licenseNo} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.licenseNo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.licenseNo && <p className="mt-1 text-sm text-red-500">{errors.licenseNo}</p>}
                  </div>
                  <div>
                    <label htmlFor="clinicHospitalType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select id="clinicHospitalType" name="clinicHospitalType" value={formData.clinicHospitalType} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.clinicHospitalType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      <option value="">Select type</option>
                      <option value="clinic">Clinic</option>
                      <option value="hospital">Hospital</option>
                    </select>
                    {errors.clinicHospitalType && <p className="mt-1 text-sm text-red-500">{errors.clinicHospitalType}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="clinicHospitalName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clinic/Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <input id="clinicHospitalName" name="clinicHospitalName" type="text" value={formData.clinicHospitalName} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.clinicHospitalName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                  {errors.clinicHospitalName && <p className="mt-1 text-sm text-red-500">{errors.clinicHospitalName}</p>}
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      I have read and accept the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Terms &amp; Conditions</a>.
                    </span>
                  </label>
                  {errors.termsAccepted && <p className="mt-1 text-sm text-red-500">{errors.termsAccepted}</p>}
                </div>
              </>
            )}

            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">
                {errors.submit}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </button>
              {allowClose && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPrompt;
